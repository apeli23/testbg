import { useState, useRef } from 'react';

export default function Processor() {
    let video, canvas, outputContext, temporaryCanvas, temporaryContext;
    const canvasRef = useRef();
    const [computed, setComputed] = useState(false);
    const [link, setLink] = useState('');

    function computeFrame() {
   
        video = document.getElementById("video")

        temporaryCanvas = document.createElement("canvas");
        temporaryCanvas.setAttribute("width", 800);
        temporaryCanvas.setAttribute("height", 450);
        temporaryContext = temporaryCanvas.getContext("2d");

        canvas = document.getElementById("output-canvas");
        outputContext = canvas.getContext("2d");

        temporaryContext.drawImage(video, 0, 0, video.width, video.height);
        let frame = temporaryContext.getImageData(0, 0, video.width, video.height);

        for (let i = 0; i < frame.data.length / 4; i++) {
            let r = frame.data[i * 4 + 0];
            let g = frame.data[i * 4 + 1];
            let b = frame.data[i * 4 + 2];

            if (r > 70 && r < 160 && g > 95 && g < 220 && b > 25 && b < 150) {
                frame.data[i * 4 + 3] = 0;
            }
        }
        outputContext.putImageData(frame, 0, 0)
        setTimeout(computeFrame, 0);


        const chunks = []; 
        const cnv = canvasRef.current;
        const stream = cnv.captureStream();  
        const rec = new MediaRecorder(stream); 
        rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = e => uploadHandler(new Blob(chunks, { type: 'video/webm' }));
        rec.start();
        setTimeout(() => rec.stop(), 16000); 
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
        executed=true

    }
var executed = false;
    async function uploadHandler(blob) {
        await readFile(blob).then((encoded_file) => {
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
         <>
            <header className="header">
                <div className="text-box">
                    <h1 className="heading-primary">
                        <span className="heading-primary-main">Cloudinary Chroma Keying</span>
                    </h1>
                    <a href="#" className="btn btn-white btn-animated" onClick={computeFrame}>Remove Background</a>
                </div>
            </header>
            <div className="row">
                <div className="column">
                    <video className="video" crossOrigin="Anonymous" src='https://res.cloudinary.com/dogjmmett/video/upload/v1662460012/sample_2_bvyxft.mp4' id='video' width='400' height='360' autoPlay muted type="video/mp4" />
                </div>
                <div className="column">
                    { link ? <a href={link}>LINK : {link}</a> : <h3>your link will show here...</h3>}
                    <canvas className="canvas" ref={canvasRef} id="output-canvas" width="500" height="360" ></canvas><br />
                </div>
            </div>
        </>
        </>
    )
}