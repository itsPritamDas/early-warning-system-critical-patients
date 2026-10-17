"""CNN-LSTM with temporal attention for ICU deterioration risk research.

Inputs are batches shaped (batch, sequence_length, number_of_features).
The model returns logits; use BCEWithLogitsLoss during training.
"""
from __future__ import annotations

import torch
from torch import nn


class CNNLSTMAttention(nn.Module):
    """A compact, trainable research architecture matching the project report."""

    def __init__(
        self,
        n_features: int,
        cnn_channels: int = 64,
        hidden_size: int = 64,
        lstm_layers: int = 1,
        dropout: float = 0.25,
    ) -> None:
        super().__init__()
        if n_features < 1:
            raise ValueError("n_features must be positive")
        self.feature_extractor = nn.Sequential(
            nn.Conv1d(n_features, cnn_channels, kernel_size=3, padding=1),
            nn.BatchNorm1d(cnn_channels),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Conv1d(cnn_channels, cnn_channels, kernel_size=3, padding=1),
            nn.GELU(),
        )
        self.temporal_encoder = nn.LSTM(
            input_size=cnn_channels,
            hidden_size=hidden_size,
            num_layers=lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_layers > 1 else 0.0,
        )
        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1, bias=False),
        )
        self.classifier = nn.Sequential(
            nn.LayerNorm(hidden_size * 2),
            nn.Dropout(dropout),
            nn.Linear(hidden_size * 2, hidden_size),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, 1),
        )

    def forward(self, x: torch.Tensor, return_attention: bool = False):
        if x.ndim != 3:
            raise ValueError("Expected input with shape (batch, sequence_length, features)")
        features = self.feature_extractor(x.transpose(1, 2)).transpose(1, 2)
        encoded, _ = self.temporal_encoder(features)
        weights = torch.softmax(self.attention(encoded).squeeze(-1), dim=1)
        context = torch.sum(encoded * weights.unsqueeze(-1), dim=1)
        logits = self.classifier(context).squeeze(-1)
        if return_attention:
            return logits, weights
        return logits
