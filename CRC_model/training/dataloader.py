from torch.utils.data import DataLoader, random_split
from data.dataset import KvasirSegDataset
from utils.transforms import get_transforms

def get_dataloaders(root_dir, batch_size=8, val_split=0.2):
    transform_img, transform_mask = get_transforms()
    dataset = KvasirSegDataset(root_dir, transform=transform_img, target_transform=transform_mask)

    val_size = int(len(dataset) * val_split)
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader
