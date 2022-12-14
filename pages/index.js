import { useState, useRef, useEffect } from 'react';


export default function Home() {
  let video, canvas, outputContext, temporaryCanvas, temporaryContext, video2;
  const canvasRef = useRef();
  const videoRef = useRef(undefined);
  const btnRef = useRef(null);

  const [computed, setComputed] = useState(false);
  const [link, setLink] = useState('');
  const [blob, setBlob] = useState();


  useEffect(() => {
    video = document.getElementById('video');

    canvas = document.getElementById('output-canvas');
    outputContext = canvas.getContext('2d');

    temporaryCanvas = document.createElement('canvas');
    temporaryCanvas.setAttribute('width', 800);
    temporaryCanvas.setAttribute('height', 450);
    temporaryContext = temporaryCanvas.getContext('2d');
    video.addEventListener("play", console.log('play'))

    computeFrame()
  }, []);

  async function computeFrame() {

    if (video.paused || video.ended) {
      return;
    }


    temporaryContext.drawImage(video, 0, 0, video.width, video.height);
    let frame = temporaryContext.getImageData(0, 0, video.width, video.height);

    for (let i = 0; i < frame.data.length / 4; i++) {
      let r = frame.data[i * 4 + 0];
      let g = frame.data[i * 4 + 1];
      let b = frame.data[i * 4 + 2];

      if (r >= 0 && r < 55 && g > 170 && g < 180 && b >= 0 && b < 8) {
        frame.data[i * 4 + 3] = 3;
      }
    }
    outputContext.putImageData(frame, 0, 0)
    setTimeout(computeFrame, 0);

    const chunks = [];
    const cnv = canvasRef.current;
    const stream = cnv.captureStream();
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = e => setBlob(new Blob(chunks, { type: 'video/webm' }));
    rec.start();
    setTimeout(() => {
      rec.stop()
      let button = document.getElementById('button');
      button.style.display = "inline-block";
    }, 5000);
  }


  function readFile(file) {
    return new Promise(function (resolve, reject) {
      let fr = new FileReader();

      fr.onload = function () {
        resolve(fr.result);
      };

      fr.onerror = function () {
        reject(fr);
      };

      fr.readAsDataURL(file);
    });
  }

  async function uploadHandler() {
    console.log(blob)
    await readFile(blob).then((encoded_file) => {
      console.log(encoded_file)
      try {
        fetch('/api/cloudinary', {
          method: 'POST',
          body: JSON.stringify({ data: encoded_file }),
          headers: { 'Content-Type': 'application/json' },
        })
          .then((response) => response.json())
          .then((data) => {
            setComputed(true);
            setLink(data.data);
          });
      } catch (error) {
        console.error(error);
      }
    });
  }
  return (
    <>
      <div className='container'>
      <header className="header">
          <div className="text-box">
            <h1 className="heading-primary">
              <span className="heading-primary-main">
                Cloudinary Chroma Keying
              </span>
            </h1>
            <a
              href="#"
              className="btn btn-white btn-animated"
              onClick={computeFrame}
            >
              Remove Background
            </a>
          </div>
        </header>
        <div className="row">
          <div className="column">
            <video className="video" crossOrigin="Anonymous" src='https://res.cloudinary.com/dogjmmett/video/upload/v1644847286/foreground_z4ga7a.mp4' id='video' width='800' height='450' autoPlay muted loop type="video/mp4" />
          </div>
          <div className="column">
            {link ? <a href={link}>LINK : {link}</a> : <h3>your link will show here...</h3>}
            <canvas className="canvas" ref={canvasRef} id="output-canvas" width="800" height="450" ></canvas><br />
            <a
            id = "button"
              href="#"
              className="btn btn-white btn-animated"
              onClick={uploadHandler}
              // ref={btnRef}
            >
              Create  Video Link
            </a>
          </div>
        </div>
      </div>
    </>
  )
};