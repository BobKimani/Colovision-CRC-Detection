import torchvision.transforms as T

def get_transforms(img_size=256):
    transform_img = T.Compose([
        T.Resize((img_size, img_size)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225])
    ])
    
    transform_mask = T.Compose([
        T.Resize((img_size, img_size)),
        T.ToTensor()
    ])
    
    return transform_img, transform_mask
