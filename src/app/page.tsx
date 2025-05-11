'use client';
import React, { useState } from 'react';

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [centerValue, setCenterValue] = useState<number>(5);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
        setProcessedImage(null);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSharpen = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) return;

      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      const output = new Uint8ClampedArray(data);

      const kernel = [
        [ 0, -1,  0],
        [-1, centerValue, -1],
        [ 0, -1,  0]
      ];
      const factor = centerValue - 4;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const px = ((y + ky) * width + (x + kx)) * 4 + c;
                sum += data[px] * kernel[ky + 1][kx + 1];
              }
            }
            const index = (y * width + x) * 4 + c;
            output[index] = Math.min(Math.max(sum / factor, 0), 255);
          }
          output[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
        }
      }

      const outputImageData = new ImageData(output, width, height);
      ctx?.putImageData(outputImageData, 0, 0);
      setProcessedImage(canvas.toDataURL());
    };
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Làm sắc nét ảnh (Sharpen)</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div className="my-4">
        <label className="mr-2">Giá trị trung tâm kernel:</label>
        <input
          type="number"
          value={centerValue}
          onChange={(e) => setCenterValue(Number(e.target.value))}
          className="border px-2 py-1 w-20"
        />
        <button
          onClick={handleSharpen}
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Xử lý
        </button>
      </div>
      <div className="flex gap-4">
        {image && (
          <div>
            <p>Ảnh gốc:</p>
            <img src={image} alt="Original" className="max-w-xs" />
          </div>
        )}
        {processedImage && (
          <div>
            <p>Ảnh đã xử lý:</p>
            <img src={processedImage} alt="Processed" className="max-w-xs" />
          </div>
        )}
      </div>
    </main>
  );
}