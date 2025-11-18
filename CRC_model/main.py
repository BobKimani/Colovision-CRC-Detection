import torch
import matplotlib
matplotlib.use("TkAgg")   # Ensures GUI works
import matplotlib.pyplot as plt
from data.dataset import KvasirSegDataset
from utils.transforms import get_transforms

def test_dataset():
    root_dir = "data/kvasir_seg"  # path to your dataset
    transform_img, transform_mask = get_transforms(img_size=256)

    dataset = KvasirSegDataset(
        root_dir=root_dir,
        transform=transform_img,
        target_transform=transform_mask
    )

    print(f"Total samples: {len(dataset)}")

    # --- Plot a sample ---
    img, mask = dataset[0]

    # Unnormalize for display
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    img_display = img * std + mean
    img_display = img_display.permute(1, 2, 0).numpy()  # CHW -> HWC

    mask_display = mask.squeeze().numpy()

    plt.subplot(1, 2, 1)
    plt.imshow(img_display)
    plt.title("Image")
    plt.axis("off")

    plt.subplot(1, 2, 2)
    plt.imshow(mask_display, cmap="gray")
    plt.title("Mask")
    plt.axis("off")

    plt.show(block=True)


if __name__ == "__main__":
    test_dataset()
