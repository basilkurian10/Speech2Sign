import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function initThreeJS(wordListNew,onFeedback) {
  var label = document.getElementById("label");
  var container = document.getElementById("animation");

  const fov = 75;
  const aspect = container?.clientWidth / container?.clientHeight;
  const near = 0.1;
  const far = 1000;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x053238);

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x004040);
  scene.add(ambientLight);

  renderer.setSize(container?.clientWidth, container?.clientHeight);
  container?.appendChild(renderer.domElement);

  var wordList = wordListNew;
  var wordidx = 0;
  var charidx = 0;
  var frameidx = 0;
  var isArray = false;
  var isPaused = false;  // Flag to control pausing


  fetch("/merged.json")
    .then((response) => response.json())
    .then((data) => {
      console.log("data",data)
      function drawPoint(x, y, z) {
        const pointRadius = 0.25;
        const geometry = new THREE.SphereGeometry(pointRadius, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x84ffff });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        sphere.position.set(x, y, z);

        sphere.geometry.dispose();
        sphere.material.dispose();
      }

      function drawLine(x1, y1, z1, x2, y2, z2) {
        const points = [];
        points.push(new THREE.Vector3(x1, y1, z1));
        points.push(new THREE.Vector3(x2, y2, z2));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        line.geometry.dispose();
        line.material.dispose();
      }

      function redistributeElements(left, right) {
        if (left.length > 21) {
          const redistributedElements = left.splice(21);
          right.push(...redistributedElements);
        } else if (right.length > 21) {
          const redistributedElements = right.splice(21);
          left.push(...redistributedElements);
        }
      }

      function getLeftHand() {
        var returndata = [];
        var item_to_load = "";
        if (isArray) {
          item_to_load = wordList[wordidx][charidx];
        } else {
          item_to_load = wordList[wordidx];
        }
        // if the item exists load from the data dict
        if (item_to_load in data) {
          returndata = data[item_to_load][frameidx]["Left Hand Coordinates"];
        }
        // handle undefined cases
        if (returndata) {
          return returndata;
        }
        return [];
      }

      function getRightHand() {
        var returndata = [];
        var item_to_load = "";
        if (isArray) {
          item_to_load = wordList[wordidx][charidx];
        } else {
          item_to_load = wordList[wordidx];
        }
        // if the item exists load from the data dict
        if (item_to_load in data) {
          returndata = data[item_to_load][frameidx]["Right Hand Coordinates"];
        }
        // handle undefined cases
        if (returndata) {
          return returndata;
        }
        return [];
      }

      function connectLines(frameidx) {
        const edgeList = [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
          [0, 5],
          [5, 6],
          [6, 7],
          [7, 8],
          [5, 9],
          [9, 10],
          [10, 11],
          [11, 12],
          [9, 13],
          [13, 14],
          [14, 15],
          [15, 16],
          [13, 17],
          [17, 18],
          [18, 19],
          [19, 20],
          [0, 17],
        ];
        var left = getLeftHand();
        var right = getRightHand();

        redistributeElements(left, right);

        edgeList.forEach(function (edge) {
          const u = edge[0];
          const v = edge[1];
          if (left[u] && left[v]) {
            const l1 = left[u]["Coordinates"];
            const l2 = left[v]["Coordinates"];
            drawLine(
              l1[0] * 50,
              l1[1] * -50,
              l1[2] * 50,
              l2[0] * 50,
              l2[1] * -50,
              l2[2] * 50
            );
          }
          if (right[u] && right[v]) {
            const r1 = right[u]["Coordinates"];
            const r2 = right[v]["Coordinates"];
            drawLine(
              r1[0] * 50,
              r1[1] * -50,
              r1[2] * 50,
              r2[0] * 50,
              r2[1] * -50,
              r2[2] * 50
            );
          }
        });
      }

      let clock = new THREE.Clock();
      let delta = 0;
      let interval = 1 / 20;

      function assignLabel() {
        if (isArray) {
          // we need to concatinate the letters to word the required word
          // label.innerHTML =
          //   label.innerHTML + wordList[wordidx][charidx].toUpperCase();
          label.innerHTML = wordList[wordidx].join("").toUpperCase();
        } else {
          // since it is a word we can display as it is
          label.innerHTML = wordList[wordidx].toUpperCase();
        }
      }

      function render() {
        requestAnimationFrame(render);
        delta += clock.getDelta();

        if (isPaused) {
          return;  // Skip rendering if paused
        }

        if (delta > interval) {
          delta = delta % interval;

          if (wordList?.length > 0 && wordidx < wordList?.length) {
            // animation start
            // add check for finding if it is a word or char array
            if (Array.isArray(wordList[wordidx])) {
              // char array
              isArray = true;
            } else {
              isArray = false;
            }

            assignLabel();

            var left = getLeftHand();
            var right = getRightHand();

            if (left) {
              left.forEach(function (joint) {
                drawPoint(
                  joint["Coordinates"][0] * 50,
                  joint["Coordinates"][1] * -50,
                  joint["Coordinates"][2] * 50
                );
              });
            }
            if (right) {
              right.forEach(function (joint) {
                drawPoint(
                  joint["Coordinates"][0] * 50,
                  joint["Coordinates"][1] * -50,
                  joint["Coordinates"][2] * 50
                );
              });
            }

            connectLines(frameidx);

            frameidx++;
            if (isArray) {
              // handle cases where char is not available in dict
              if (wordList[wordidx][charidx] in data == false) {
                // move to the next char
                frameidx = 0;
                charidx++;
              }
              // frame in the char frame
              console.log("data",data)
              console.log("word",data[wordList[wordidx]])
              console.log("char",data[wordList[wordidx][charidx]])
              if (frameidx >= data[wordList[wordidx][charidx]].length) {
                frameidx = 0;
                charidx++;
                // particular char animation is done now go with next char if any remaining
                if (charidx >= wordList[wordidx].length) {
                  // characters are finished, so we can go to the next word
                  wordidx++;
                  // resetting charidx
                  charidx = 0;

                  // if (Array.isArray(wordList[wordidx])) {
                  //   // clear the label as we are going to concatinate for the next word
                  //   label.innerHTML = "";
                  // }
                }
                // assignLabel();
              }
            } else {
              if (frameidx >= data[wordList[wordidx]]?.length) {
                frameidx = 0;
                wordidx++;
                // assignLabel();

                // if (Array.isArray(wordList[wordidx])) {
                //   // clear the label as we are going to concatinate for the next word
                //   label.innerHTML = "";
                // }
              }
            }
          } else {
            if(label){
              label.innerHTML = "N/A";
            }
          }
          renderer.render(scene, camera);
          scene.remove.apply(scene, scene.children);
        }
      }

      render();
      onFeedback(true);
      camera.position.set(27.5, -30, 25);
      window.pauseRendering = () => { isPaused = true; };
      window.resumeRendering = () => { 
          isPaused = false; 
          render();  // Ensure rendering continues from where it was paused
      };
    });
}
