import torch
import torch.nn as nn
import torch.nn.functional as F
import timm  # for EfficientNet backbone


class ConvBlock(nn.Module):
    """Basic convolutional block: Conv -> BN -> ReLU"""
    def __init__(self, in_channels, out_channels):
        super(ConvBlock, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class UNetEffNet(nn.Module):
    def __init__(self, backbone_name="efficientnet_b0", num_classes=1, pretrained=True):
        super(UNetEffNet, self).__init__()

        # Load EfficientNet backbone
        self.encoder = timm.create_model(backbone_name, features_only=True, pretrained=pretrained)

        encoder_channels = self.encoder.feature_info.channels()  # get feature map sizes
        self.decoder_channels = [256, 128, 64, 32]

        # Decoder layers
        self.up4 = nn.ConvTranspose2d(encoder_channels[-1], self.decoder_channels[0], kernel_size=2, stride=2)
        self.conv4 = ConvBlock(encoder_channels[-2] + self.decoder_channels[0], self.decoder_channels[0])

        self.up3 = nn.ConvTranspose2d(self.decoder_channels[0], self.decoder_channels[1], kernel_size=2, stride=2)
        self.conv3 = ConvBlock(encoder_channels[-3] + self.decoder_channels[1], self.decoder_channels[1])

        self.up2 = nn.ConvTranspose2d(self.decoder_channels[1], self.decoder_channels[2], kernel_size=2, stride=2)
        self.conv2 = ConvBlock(encoder_channels[-4] + self.decoder_channels[2], self.decoder_channels[2])

        self.up1 = nn.ConvTranspose2d(self.decoder_channels[2], self.decoder_channels[3], kernel_size=2, stride=2)
        self.conv1 = ConvBlock(encoder_channels[-5] + self.decoder_channels[3], self.decoder_channels[3])

        # Final segmentation head
        self.final_conv = nn.Conv2d(self.decoder_channels[3], num_classes, kernel_size=1)

    def forward(self, x):
        # Encoder
        features = self.encoder(x)  # list of feature maps
        # features[-1] is deepest

        # Decoder with skip connections
        d4 = self.up4(features[-1])
        d4 = torch.cat([d4, features[-2]], dim=1)
        d4 = self.conv4(d4)

        d3 = self.up3(d4)
        d3 = torch.cat([d3, features[-3]], dim=1)
        d3 = self.conv3(d3)

        d2 = self.up2(d3)
        d2 = torch.cat([d2, features[-4]], dim=1)
        d2 = self.conv2(d2)

        d1 = self.up1(d2)
        d1 = torch.cat([d1, features[-5]], dim=1)
        d1 = self.conv1(d1)

        out = self.final_conv(d1)
        out = torch.sigmoid(out)  # sigmoid for binary segmentation
        return out


if __name__ == "__main__":
    model = UNetEffNet(backbone_name="efficientnet_b4", num_classes=1)
    x = torch.randn(1, 3, 256, 256)
    y = model(x)
    print("Input:", x.shape)
    print("Output:", y.shape)
