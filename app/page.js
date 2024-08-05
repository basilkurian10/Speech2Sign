// pages/index.js

"use client";

import { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "boxicons/css/boxicons.min.css";
import Head from "next/head";
import { startTransition } from "react";
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'


const supabase = createClient('https://rhvbaatuqzvuchhbppih.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodmJhYXR1cXp2dWNoaGJwcGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI3MzQ4MzcsImV4cCI6MjAzODMxMDgzN30.TEY4i3pkT_bdj488WYMqpeJT1YGzk3YNAmuCTwM442c')


export default async function Home() {
  const textBoxRef = useRef(null);
  // const { data: session } = useSession();

  const [text, setText] = useState("Generated text appears here");

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [animationLoading, setAnimationLoading] = useState(false);
  const [animateButton, setAnimateButton] = useState(false);
  const [output, setOutput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [wordArray, setWordArray] = useState([]);


  useEffect(() => {
    const loadThreeJS = async () => {
      const module = await import("../public/main.js");
      module.initThreeJS(wordArray, handleFeedback);
    };
    loadThreeJS();
  }, [animateButton]);

  const handlePause = () => {
    if (typeof window !== "undefined" && window.pauseRendering) {
      window.pauseRendering();
    }
  };

  const handleResume = () => {
    if (typeof window !== "undefined" && window.resumeRendering) {
      window.resumeRendering();
    }
  };

  const handleFeedback = (data) => {
    console.log("Feedback received:", data);
    setTimeout(() => {
      setAnimationLoading(false);
    }, 5000);
  };

  useEffect(() => {
    const SpeechRecognition =
      window?.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setOutput((prevOutput) => [...prevOutput, ` ${transcript}`]);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setOutput((prevOutput) => [...prevOutput]);
      };
    } else {
      console.error("Speech recognition not supported");
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (output.length) {
      setText(output[0]);
    }
  }, [output]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const startListening = () => {
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current.stop();
    setOutput((prevOutput) => [...prevOutput]);
  };
  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 "></div>
  );

  const LoadingSpinnerAnimate = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-100 "></div>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(selectedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append("audioFile", selectedFile);

    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        body: formData,
      });

      console.log("response", response);

      const reader = response.body.getReader();
      const textDecoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        result += textDecoder.decode(value, { stream: true });
      }
      console.log(JSON.parse(result));
      setText(JSON.parse(result).text);

      if (response.ok) {
        console.log("File uploaded successfully");
        setUploadStatus("File uploaded successfully!");
      } else {
        console.error("File upload failed");
        setUploadStatus("Failed to upload file.");
      }
      setLoading(false);
    } catch (error) {
      console.error("An error occurred while uploading the file:", error);
    }
  };

  // const showAnimation = async () => {
  //   fetch("/api/word_data")
  //     .then((response) => response.json())
  //     .then((data) => console.log(data))
  //     .catch((error) => console.error("Error:", error));
  // };

  const siginify = async (event) => {
    setAnimationLoading(true);
    try {
      const response = await fetch("/api/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ string: text }),
      });

      console.log("response", response);
      const reader = response.body.getReader();
      const textDecoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        result += textDecoder.decode(value, { stream: true });
      }
      console.log("hai", JSON.parse(result));
      setWordArray(JSON.parse(result));
      setAnimateButton(true);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  return (
    <>
      <Auth
    supabaseClient={supabase}
    appearance={{ theme: ThemeSupa }}
    providers={['google', 'facebook', 'twitter']}
  />
      <Head>
        <title>Signify - Home</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/css/home.css" />
      </Head>
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img
              width={120}
              height={120}
              src="../signify-logo-footer.avif"
              alt="Signify Logo"
            />
          </a>
          <svg
            viewBox="0 0 1024 1024"
            class="icon"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            width={40}
            height={40}
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M512.049993 0.016664C229.336805 0.016664 0.116651 229.116001 0.116651 511.950007c0 174.135659 86.980341 327.898971 219.842209 420.345267 26.046609-90.704856 92.104674-158.833485 181.926311-189.616977 2.416352-0.829059 4.857701-1.620622 7.303216-2.395521 1.699779-0.533264 3.387059-1.087358 5.103502-1.595626a316.654602 316.654602 0 0 1 14.056503-3.841166 338.080979 338.080979 0 0 1 11.515167-2.657988c1.491472-0.312459 3.007942-0.599922 4.507747-0.895716a340.214035 340.214035 0 0 1 13.998177-2.470512 337.372738 337.372738 0 0 1 9.57792-1.337326c1.441479-0.187476 2.874626-0.38745 4.328603-0.549928a355.545372 355.545372 0 0 1 14.031506-1.353991H538.029944c4.728551 0.354121 9.398776 0.820726 14.044005 1.353991 1.424814 0.162479 2.837131 0.358287 4.253613 0.53743a361.594584 361.594584 0 0 1 14.38146 2.116391c3.212082 0.545762 6.390835 1.137352 9.557089 1.766437 1.349824 0.266632 2.703815 0.520766 4.049473 0.799895a327.582346 327.582346 0 0 1 26.067439 6.628304c1.299831 0.38745 2.574665 0.804062 3.861997 1.208176 2.970447 0.929046 5.915896 1.883088 8.832183 2.89129 89.467517 30.866814 155.250618 98.845463 181.268065 189.275355 132.745215-92.458794 219.642234-246.163781 219.642234-420.207785-0.004166-282.834006-229.220154-511.933342-511.937509-511.933343z m0 725.443042c-133.116001 0-241.02695-107.910949-241.026949-241.02695 0-1.266502 0.07499-2.516339 0.095821-3.774508-1.312329-152.371827 141.514907-244.059888 241.168598-237.252441h0.116651c102.153365-6.96576 249.88413 89.280042 241.264419 248.230178-0.254134 0.158313-0.529098 0.27913-0.783232 0.437443-4.045307 129.570629-110.281474 233.386278-240.835308 233.386278z"
                fill="#D6E079"
              ></path>
              <path
                d="M512.287463 357.482619c-24.325999 103.44903-170.644447 178.443432-240.910299 134.153366a243.572452 243.572452 0 0 1-0.258299-10.977737c-0.020831 1.262336-0.095821 2.512173-0.095821 3.774508 0 133.111834 107.910949 241.02695 241.026949 241.02695 130.553834 0 236.790001-103.815649 240.835308-233.386278-70.674131 43.277698-216.238511-31.512563-240.597838-134.590809z"
                fill="#FCE9EA"
              ></path>
              <path
                d="M566.051295 728.834266zM552.078115 726.934514c1.424814 0.162479 2.837131 0.358287 4.253613 0.53743-1.420648-0.179143-2.832964-0.374951-4.253613-0.53743zM439.867726 732.192162c1.491472-0.312459 3.007942-0.599922 4.507746-0.895716-1.499805 0.295795-3.016274 0.583257-4.507746 0.895716zM610.383023 738.782971c1.299831 0.38745 2.574665 0.804062 3.861997 1.208176-1.287332-0.404114-2.566333-0.820726-3.861997-1.208176zM453.515948 729.613332zM425.382112 735.604218zM467.951569 727.484442c1.441479-0.187476 2.874626-0.38745 4.328603-0.549928-1.453977 0.162479-2.887124 0.362453-4.328603 0.549928zM580.266111 731.354772c1.349824 0.266632 2.703815 0.520766 4.049473 0.799895-1.341492-0.27913-2.699648-0.533264-4.049473-0.799895zM512.049993 823.834397c-0.995704 0-1.978909-0.05416-2.96628-0.074991l2.96628 2.078896 2.957949-2.078896c-0.983205 0.024997-1.966411 0.07499-2.957949 0.074991z"
                fill="#A0D9F6"
              ></path>
              <path
                d="M623.077203 742.882437c0.81656 0.27913 1.633121 0.574925 2.445515 0.862388a119.234475 119.234475 0 0 1-10.456971 22.092957c17.285249 26.21742 12.985809 141.631558-12.910819 123.417263l-45.110793-31.650046-44.994142-31.766697-45.110792 31.766697-44.994142 31.650046c-25.896628 18.214295-30.196068-97.199844-12.910819-123.413097a119.651087 119.651087 0 0 1-10.423642-22.005468c1.091525-0.38745 2.178883-0.783231 3.274573-1.154017-89.825804 30.783492-155.879703 98.907955-181.926311 189.616977 82.84338 57.646661 183.513605 91.467257 292.091133 91.467257 108.665018 0 209.410233-33.874756 292.291108-91.604739-26.017446-90.434058-91.800547-158.412707-181.263898-189.279521zM409.192553 740.282776c1.699779-0.53743 3.387059-1.087358 5.103502-1.595626-1.716443 0.508267-3.40789 1.062362-5.103502 1.595626z"
                fill="#A0D9F6"
              ></path>
              <path
                d="M409.038406 765.841948c3.449551-5.228486 7.744825-6.932431 12.910819-3.299571l44.994142 31.650046 42.144512 29.571149c0.987371 0.020831 1.970577 0.07499 2.966281 0.074991 0.991538 0 1.974743-0.049993 2.957948-0.074991l42.036193-29.571149 45.110793-31.650046c5.161828-3.63286 9.461268-1.928916 12.910819 3.295405a119.109491 119.109491 0 0 0 10.456972-22.092957c-0.812394-0.287463-1.628955-0.583257-2.445515-0.862388-2.916287-1.008202-5.861737-1.966411-8.832184-2.89129-1.287332-0.404114-2.562166-0.820726-3.861997-1.208176a329.382112 329.382112 0 0 0-26.067439-6.628304c-1.341492-0.27913-2.695482-0.533264-4.049473-0.799895-3.166254-0.624919-6.345007-1.220674-9.557089-1.766437a349.579482 349.579482 0 0 0-14.38146-2.116391c-1.416482-0.179143-2.828798-0.374951-4.253613-0.53743a356.182789 356.182789 0 0 0-14.044005-1.353991H486.311678a356.311939 356.311939 0 0 0-14.031506 1.353991c-1.449811 0.162479-2.882958 0.362453-4.328603 0.549928a353.141518 353.141518 0 0 0-14.435621 2.124723 354.20388 354.20388 0 0 0-9.140476 1.683115c-1.499805 0.295795-3.016274 0.583257-4.507746 0.895716-3.874496 0.820726-7.711496 1.708111-11.515168 2.657988-0.991538 0.249967-1.983075 0.499935-2.970446 0.758234a323.374561 323.374561 0 0 0-11.086057 3.082932c-1.716443 0.508267-3.403723 1.058196-5.103502 1.595626a340.164041 340.164041 0 0 0-7.303216 2.395521c-1.095691 0.374951-2.183049 0.770733-3.274573 1.154017a119.017836 119.017836 0 0 0 10.423642 22.009634z"
                fill="#FEFEFE"
              ></path>
              <path
                d="M602.154928 762.542377l-45.110793 31.650046-42.036193 29.571149-2.957949 2.078896 44.994142 31.766697 45.110793 31.650046c25.896628 18.214295 30.196068-97.199844 12.910819-123.417263-3.445385-5.228486-7.748991-6.932431-12.910819-3.299571zM466.939201 794.192423l-44.994142-31.650046c-5.161828-3.63286-9.461268-1.928916-12.910819 3.299571-17.285249 26.213253-12.985809 141.627392 12.910819 123.413097l44.994142-31.650046 45.110792-31.766697-2.96628-2.078896-42.144512-29.566983z"
                fill="#FA9689"
              ></path>
              <path
                d="M512.287463 357.482619V243.405807c-99.653691-6.803281-242.480927 84.884781-241.168598 237.252441 0.029163 3.637026 0.062492 7.274053 0.258299 10.977737 70.265851 44.2859 216.580133-30.704335 240.910299-134.153366z"
                fill="#FECF77"
              ></path>
              <path
                d="M512.287463 357.482619c24.359328 103.078245 169.923708 177.868507 240.597838 134.590809 0.2583-0.158313 0.533264-0.27913 0.783232-0.437443 8.619711-158.954303-139.115219-255.200104-241.264419-248.230178h-0.116651v114.076812z"
                fill="#F7B970"
              ></path>
            </g>
          </svg>
          {/* {user?.email} */}
        </div>
      </nav>
      <section id="container-fluid">
        <section id="left-panel" className="container-fluid">
          <div className="flex justify-between w-full">
            <button
              onClick={startListening}
              disabled={isListening}
              className="btn btn-primary"
            >
              {" "}
              {isListening ? (
                <span class="animate-ping inline-flex h-2 w-2 rounded-full bg-red-400 opacity-100"></span>
              ) : null}{" "}
              🎤 Start Recording
            </button>
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="btn btn-danger"
            >
              Stop
            </button>
          </div>
          <div className="mt-1 max-w-lg mx-auto p-4 bg-white shadow-lg rounded-lg">
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center ${
                dragging
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <p className="mb-2 text-gray-600">Drag and drop your file here</p>
              <p className="mb-2 text-gray-600">or</p>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Browse Files
              </label>
            </div>
            {selectedFile && (
              <div className="">
                <p className="text-gray-700">File name: {selectedFile.name}</p>
              </div>
            )}
            <div className="mt-2">
              <button
                onClick={handleSubmit}
                className=" flex flex-row bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <g id="File / File_Upload">
                      {" "}
                      <path
                        id="Vector"
                        d="M12 18V12M12 12L9 14M12 12L15 14M13 3.00087C12.9045 3 12.7973 3 12.6747 3H8.2002C7.08009 3 6.51962 3 6.0918 3.21799C5.71547 3.40973 5.40973 3.71547 5.21799 4.0918C5 4.51962 5 5.08009 5 6.2002V17.8002C5 18.9203 5 19.4801 5.21799 19.9079C5.40973 20.2842 5.71547 20.5905 6.0918 20.7822C6.51921 21 7.079 21 8.19694 21L15.8031 21C16.921 21 17.48 21 17.9074 20.7822C18.2837 20.5905 18.5905 20.2842 18.7822 19.9079C19 19.4805 19 18.9215 19 17.8036V9.32568C19 9.20296 19 9.09561 18.9991 9M13 3.00087C13.2856 3.00347 13.4663 3.01385 13.6388 3.05526C13.8429 3.10425 14.0379 3.18526 14.2168 3.29492C14.4186 3.41857 14.5918 3.59182 14.9375 3.9375L18.063 7.06298C18.4089 7.40889 18.5809 7.58136 18.7046 7.78319C18.8142 7.96214 18.8953 8.15726 18.9443 8.36133C18.9857 8.53376 18.9963 8.71451 18.9991 9M13 3.00087V5.8C13 6.9201 13 7.47977 13.218 7.90759C13.4097 8.28392 13.7155 8.59048 14.0918 8.78223C14.5192 9 15.079 9 16.1969 9H18.9991M18.9991 9H19.0002"
                        stroke="#ffffff"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>{" "}
                    </g>{" "}
                  </g>
                </svg>
                Upload File
              </button>
            </div>
          </div>

          {/* <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} />
            <button type="submit" className="btn btn-primary mt-2">Upload</button>
          </form> */}

          <div className="relative">
            {output ? (
              <textarea
                value={output}
                className="form-control border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-96 h-40 p-4 rounded-lg"
                id="text-box"
                rows="10"
                cols="30"
                ref={textBoxRef}
              ></textarea>
            ) : (
              <textarea
                value={text}
                className="form-control border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-96 h-40 p-4 rounded-lg"
                id="text-box"
                rows="10"
                cols="30"
                ref={textBoxRef}
              ></textarea>
            )}
            {loading ? (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <LoadingSpinner />{" "}
              </div>
            ) : null}
          </div>

          <button
            onClick={siginify}
            type="button"
            className="btn btn-primary"
            id="signify-button"
          >
            <div className="flex flex-row justify-betweeen">
              {animationLoading ? <LoadingSpinnerAnimate /> : null}
              <div className="mx-2">Signify</div>
            </div>
          </button>
        </section>
        <div className="separator"></div>
        <section id="right-panel" className="container-fluid text-center">
          <h4 className="text-center">Signify Animation</h4>
          {/* <button
            type="button"
            className="btn btn-primary text-center"
            id="pauseButton"
            onClick={()=>{setPause(true)}}
          >
            Play/Pause
          </button> */}
          <div className=" w-full flex flex-row justify-center">
            <button
              onClick={handlePause}
              type="button"
              className="btn btn-primary text-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#ffffff"
                width={20}
                height={20}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M8 5V19M16 5V19"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            </button>
            <button
              onClick={handleResume}
              type="button"
              className="mx-2 btn btn-primary text-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z"
                    stroke="#ffffff"
                    stroke-width="2"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            </button>
          </div>
          {animateButton ? (
            <>
              <h1 id="label"></h1>
              <div className="w-full h-60" id="animation"></div>
            </>
          ) : (
            <>
              <div className="mt-2 h-60 mt-1 max-w-xl mx-auto p-4 bg-white shadow-lg rounded-lg"></div>
            </>
          )}
        </section>
      </section>
    </>
  );
}
