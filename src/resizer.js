import React, { useState } from 'react';
import Resizer from 'react-image-file-resizer';
import loadingImg from './loading.gif';

const ImageResizer = () => {
  const [resizedImages, setResizedImages] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(35); // Default width
  const [height, setHeight] = useState(30); // Default height

  const resizeFile = (file) =>
    new Promise((resolve, reject) => {
      Resizer.imageFileResizer(
        file,
        width, // Use user-defined width
        height, // Use user-defined height
        'PNG',
        100,
        0,
        (uri) => {
          fetch(uri)
            .then((res) => res.blob())
            .then((blob) => {
              resolve({ blob, uri, name: file.name });
            })
            .catch((error) => {
              reject(error);
            });
        },
        'base64'
      );
    });

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    const promises = files.map(file => resizeFile(file));

    setLoading(true);

    try {
      const resizedImages = await Promise.all(promises);
      setResizedImages(resizedImages);

      // Download in batches of 10 images
      for (let i = 0; i < resizedImages.length; i += 8) {
        const batch = resizedImages.slice(i, i + 8);
        
        for (const { blob, name } of batch) {
          const link = document.createElement('a');
          const url = window.URL.createObjectURL(blob);
          link.href = url;
          link.download = name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Check if download was successful
          if (!document.hasFocus()) {
            setAlertMessage(`Failed to download ${name}`);
          }
        }

        // Pause for 5 seconds between batches
        if (i + 8 < resizedImages.length) {
          await delay(5000); // 5 seconds delay
        }
      }
    } catch (error) {
      setAlertMessage('Failed to resize/upload one or more images.');
    } finally {
      setLoading(false);
      alert('다운로드가 완료되었습니다.');
    }
  };

  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  return (
    <div style={{ marginLeft: '20px' }}>
      {loading && <img src={loadingImg} alt="로딩 중..." />}
      {alertMessage && <div className="alert alert-danger">{alertMessage}</div>}
      <div style={{ textAlign: 'left'}}>
        사용방법:<br />
        1. 가로 세로 크기 입력<br/>
        2. 파일 선택 → 이미지 선택 (다중 선택 가능)<br />
        3. 자동으로 다운로드 진행됨. 크롬에서 여러 파일 다운로드 '허용' <br />
        <span style={{fontSize:'14px'}}>(최초 실행시 여러 파일 다운로드 미허용이므로, 2개를 먼저 업로드하여 허용한 후 전체 업로드 할 것) </span><br/>
        4. 크롬에서는 동시 다운로드가 10개까지만 지원하므로, 9개 다운 + 5초 휴식 패턴으로 반복됨<br />
        <br />
        <br />
        <label>
          가로(px):
          <input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value))} />
        </label>
        <label style={{ marginLeft: '10px' }}>
          세로(px):
          <input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value))} />
        </label>
      </div>
      <input type="file" multiple onChange={handleFileChange} />
      {resizedImages.length > 0 && (
        <div>
          <h3>리사이즈된 이미지 (총: {resizedImages.length}개):</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {resizedImages.map((image, index) => (
              <div key={index} style={{ width: '33.33%', marginBottom: '20px', boxSizing: 'border-box', textAlign: 'center', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', paddingRight: '10px' }}>{index + 1}.</span>
                <img src={image.uri} alt={`resized-${index}`} style={{ maxWidth: '100%', height: 'auto' }} />
                <span style={{ paddingLeft: '10px' }}> {image.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
