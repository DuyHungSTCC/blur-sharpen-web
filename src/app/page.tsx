'use client';
import React, { useState } from 'react';

export default function Page() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [kernelSize, setKernelSize] = useState(3);
  const [centerValue, setCenterValue] = useState(5);

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

  const generateSharpenKernel = (size: number, centerVal: number) => {
    const kernel: number[][] = [];
    const offset = Math.floor(size / 2);
    const sideVal = -1;
    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      for (let x = 0; x < size; x++) {
        row.push(x === offset && y === offset ? centerVal : sideVal);
      }
      kernel.push(row);
    }
    return kernel;
  };

  const handleSharpen = () => {
    if (!image || kernelSize < 1) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const kernel = generateSharpenKernel(kernelSize, centerValue);
      const width = canvas.width;
      const height = canvas.height;
      const output = new Uint8ClampedArray(data);
      const r = Math.floor(kernelSize / 2);
      const index = (x: number, y: number, c: number) => ((y * width + x) * 4 + c);

      for (let y = r; y < height - r; y++) {
        for (let x = r; x < width - r; x++) {
          for (let c = 0; c < 3; c++) {
            let newValue = 0;
            for (let ky = -r; ky <= r; ky++) {
              for (let kx = -r; kx <= r; kx++) {
                newValue += data[index(x + kx, y + ky, c)] * kernel[ky + r][kx + r];
              }
            }
            output[index(x, y, c)] = Math.min(255, Math.max(0, newValue));
          }
          output[index(x, y, 3)] = data[index(x, y, 3)];
        }
      }

      for (let i = 0; i < data.length; i++) {
        imageData.data[i] = output[i];
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL());
    };
  };

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h2>Ứng dụng làm sắc nét ảnh (Web)</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div style={{ marginTop: 10 }}>
        <label>Kích thước nhân: </label>
        <select value={kernelSize} onChange={(e) => setKernelSize(Number(e.target.value))}>
          {[3, 5, 7].map(size => (
            <option key={size} value={size}>{size} x {size}</option>
          ))}
        </select>
        <div style={{ marginTop: 10 }}>
          <label>Giá trị trung tâm: </label>
          <input
            type="number"
            value={centerValue}
            onChange={(e) => setCenterValue(Number(e.target.value))}
            min={1}
            max={99}
          />
        </div>
      </div>
      <button style={{ marginTop: 10 }} onClick={handleSharpen}>Xử lý làm sắc nét</button>
      {image && (
        <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
          <div style={{ flex: 1 }}>
            <h4>Ảnh gốc:</h4>
            <img src={image} alt="Original" style={{ width: '100%' }} />
          </div>
          {processedImage && (
            <div style={{ flex: 1 }}>
              <h4>Ảnh sau khi xử lý:</h4>
              <img src={processedImage} alt="Sharpened" style={{ width: '100%' }} />
              <a
                href={processedImage}
                download="sharpened-image.png"
                style={{ display: 'inline-block', marginTop: 10 }}
              >
                📥 Tải ảnh về
              </a>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
