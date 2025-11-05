import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau

from data.dataset import KvasirSegDataset
from utils.transforms import get_transforms
from model.unet_effnet import UNetEffNet


# ----------------------------
# 1. Dice Loss (for segmentation)
# ----------------------------
class DiceLoss(nn.Module):
    def __init__(self, smooth=1e-6):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, y_pred, y_true):
        y_pred = y_pred.view(-1)
        y_true = y_true.view(-1)

        intersection = (y_pred * y_true).sum()
        dice = (2. * intersection + self.smooth) / (y_pred.sum() + y_true.sum() + self.smooth)
        return 1 - dice


# ----------------------------
# 2. Training function
# ----------------------------
def train_one_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    running_loss = 0.0

    for images, masks in dataloader:
        images, masks = images.to(device), masks.to(device)

        optimizer.zero_grad()
        outputs = model(images)

        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    return running_loss / len(dataloader)


# ----------------------------
# 3. Validation function
# ----------------------------
def validate(model, dataloader, criterion, device):
    model.eval()
    val_loss = 0.0
    dice_score = 0.0

    with torch.no_grad():
        for images, masks in dataloader:
            images, masks = images.to(device), masks.to(device)

            outputs = model(images)
            loss = criterion(outputs, masks)
            val_loss += loss.item()

            # Compute Dice score
            preds = (outputs > 0.5).float()
            intersection = (preds * masks).sum()
            dice = (2. * intersection) / (preds.sum() + masks.sum() + 1e-6)
            dice_score += dice.item()

    return val_loss / len(dataloader), dice_score / len(dataloader)


# ----------------------------
# 4. Main training loop
# ----------------------------
def main():
    # Hyperparameters
    root_dir = "data/kvasir_seg"
    img_size = 256
    batch_size = 8
    lr = 1e-4
    num_epochs = 20
    val_split = 0.2

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Transforms
    transform_img, transform_mask = get_transforms(img_size)

    # Dataset
    dataset = KvasirSegDataset(root_dir, transform_img, transform_mask)

    # Train/validation split
    val_size = int(len(dataset) * val_split)
    train_size = len(dataset) - val_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Model
    model = UNetEffNet(backbone_name="efficientnet_b0", num_classes=1).to(device)

    # Loss = BCE + Dice
    bce = nn.BCELoss()
    dice = DiceLoss()
    criterion = lambda y_pred, y_true: bce(y_pred, y_true) + dice(y_pred, y_true)

    optimizer = Adam(model.parameters(), lr=lr)
    scheduler = ReduceLROnPlateau(optimizer, mode="min", patience=3, factor=0.5)

    # Training loop
    best_val_dice = 0.0
    save_path = "best_model.pth"

    for epoch in range(num_epochs):
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_dice = validate(model, val_loader, criterion, device)

        scheduler.step(val_loss)

        print(f"Epoch {epoch+1}/{num_epochs}")
        print(f"  Train Loss: {train_loss:.4f}")
        print(f"  Val Loss:   {val_loss:.4f}")
        print(f"  Val Dice:   {val_dice:.4f}")

        # Save best model
        if val_dice > best_val_dice:
            best_val_dice = val_dice
            torch.save(model.state_dict(), save_path)
            print(f"  ✅ Saved best model with Dice: {val_dice:.4f}")


if __name__ == "__main__":
    main()
