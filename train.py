"""Train and evaluate the CNN-LSTM-attention model on prepared NPZ splits."""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import (accuracy_score, average_precision_score, confusion_matrix,
                             f1_score, precision_score, recall_score, roc_auc_score)
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from model import CNNLSTMAttention


def args_parse():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data-dir", default="processed")
    p.add_argument("--output-dir", default="artifacts")
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--learning-rate", type=float, default=1e-3)
    p.add_argument("--patience", type=int, default=5)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--threshold", type=float, default=0.5)
    return p.parse_args()


def load_split(path: Path, device: torch.device):
    if not path.is_file():
        raise FileNotFoundError(f"Expected prepared split at {path}. Run prepare_data.py first.")
    data = np.load(path)
    x = torch.tensor(data["X"], dtype=torch.float32)
    y = torch.tensor(data["y"], dtype=torch.float32)
    if x.ndim != 3 or len(x) == 0:
        raise ValueError(f"{path.name} must contain a non-empty X array shaped (samples, sequence, features).")
    return TensorDataset(x, y)


def evaluate(model, loader, device, threshold: float):
    model.eval(); labels=[]; probabilities=[]; losses=[]
    criterion = nn.BCEWithLogitsLoss()
    with torch.no_grad():
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            logits = model(xb)
            losses.append(criterion(logits, yb).item())
            probabilities.extend(torch.sigmoid(logits).cpu().numpy().tolist())
            labels.extend(yb.cpu().numpy().astype(int).tolist())
    y_true=np.asarray(labels,dtype=int); y_prob=np.asarray(probabilities,dtype=float); y_pred=(y_prob>=threshold).astype(int)
    result={
        "n_samples":int(len(y_true)),"positive_samples":int(y_true.sum()),"loss":float(np.mean(losses)),
        "accuracy":float(accuracy_score(y_true,y_pred)),"precision":float(precision_score(y_true,y_pred,zero_division=0)),
        "recall_sensitivity":float(recall_score(y_true,y_pred,zero_division=0)),"f1":float(f1_score(y_true,y_pred,zero_division=0)),
        "threshold":float(threshold),"confusion_matrix_tn_fp_fn_tp":confusion_matrix(y_true,y_pred,labels=[0,1]).ravel().tolist()
    }
    result["auroc"] = float(roc_auc_score(y_true,y_prob)) if len(np.unique(y_true))==2 else None
    result["auprc"] = float(average_precision_score(y_true,y_prob)) if len(np.unique(y_true))==2 else None
    return result


def main():
    args=args_parse()
    if args.epochs < 1 or args.batch_size < 1 or args.patience < 1:
        raise ValueError("epochs, batch-size and patience must be positive integers")
    random.seed(args.seed); np.random.seed(args.seed); torch.manual_seed(args.seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(args.seed)
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
    data_dir=Path(args.data_dir); out=Path(args.output_dir); out.mkdir(parents=True,exist_ok=True)
    train_ds=load_split(data_dir/"train.npz",device); val_ds=load_split(data_dir/"validation.npz",device); test_ds=load_split(data_dir/"test.npz",device)
    ytrain=np.concatenate([train_ds[i][1].numpy().reshape(-1) for i in range(len(train_ds))])
    positives=float(ytrain.sum()); negatives=float(len(ytrain)-positives)
    if positives==0 or negatives==0:
        raise ValueError("Training labels must include both classes; revisit cohort definition and patient split.")
    x0,_=train_ds[0]
    model=CNNLSTMAttention(n_features=x0.shape[-1]).to(device)
    train_loader=DataLoader(train_ds,batch_size=args.batch_size,shuffle=True)
    val_loader=DataLoader(val_ds,batch_size=args.batch_size,shuffle=False)
    test_loader=DataLoader(test_ds,batch_size=args.batch_size,shuffle=False)
    optimizer=torch.optim.AdamW(model.parameters(),lr=args.learning_rate,weight_decay=1e-4)
    pos_weight=torch.tensor([negatives/positives],dtype=torch.float32,device=device)
    criterion=nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    best_val=float("inf"); best_epoch=0; stale=0; history=[]
    for epoch in range(1,args.epochs+1):
        model.train(); batch_losses=[]
        for xb,yb in train_loader:
            xb,yb=xb.to(device),yb.to(device)
            optimizer.zero_grad(set_to_none=True); logits=model(xb); loss=criterion(logits,yb)
            loss.backward();nn.utils.clip_grad_norm_(model.parameters(),max_norm=1.0);optimizer.step();batch_losses.append(loss.item())
        val=evaluate(model,val_loader,device,args.threshold)
        row={"epoch":epoch,"train_loss":float(np.mean(batch_losses)),"validation_loss":val["loss"],"validation_accuracy":val["accuracy"],"validation_auroc":val["auroc"],"validation_auprc":val["auprc"]}
        history.append(row);print(json.dumps(row))
        if val["loss"] < best_val:
            best_val=val["loss"];best_epoch=epoch;stale=0;torch.save({"state_dict":model.state_dict(),"n_features":int(x0.shape[-1]),"sequence_length":int(x0.shape[0]),"threshold":args.threshold,"best_epoch":epoch},out/"cnn_lstm_attention.pt")
        else:
            stale+=1
            if stale>=args.patience:
                print(f"Early stopping at epoch {epoch}; best epoch was {best_epoch}.");break
    checkpoint=torch.load(out/"cnn_lstm_attention.pt",map_location=device,weights_only=True)
    model.load_state_dict(checkpoint["state_dict"])
    metrics={"device":str(device),"best_epoch":best_epoch,"validation":evaluate(model,val_loader,device,args.threshold),"test":evaluate(model,test_loader,device,args.threshold),"training_history":history,"warning":"Metrics describe this training run and dataset only; not clinical validation or a guarantee of generalization."}
    (out/"metrics.json").write_text(json.dumps(metrics,indent=2),encoding="utf-8")
    np.savez_compressed(out/"training_history.npz",epoch=np.asarray([r["epoch"] for r in history]),train_loss=np.asarray([r["train_loss"] for r in history]),validation_loss=np.asarray([r["validation_loss"] for r in history]))
    print(json.dumps({k:v for k,v in metrics.items() if k!="training_history"},indent=2))

if __name__ == "__main__":
    main()
