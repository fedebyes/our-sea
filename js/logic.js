function onWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix(); // force the camera to update its aspect ratio
  // recalculate the limits
 	var ang = (fieldOfView/2)* Math.PI / 180;
  yLimit = (camera.position.z + maxParticlesZ) * Math.tan(ang);
  xLimit = yLimit *camera.aspect;
}

function handleMouseMove(event) {
  mousePos = {x:event.clientX, y:event.clientY};
  updateSpeed()
}

function handleTouchStart(event) {
  if (event.touches.length > 1) {
    //event.preventDefault();
		mousePos = {x:event.touches[0].pageX, y:event.touches[0].pageY};
    updateSpeed();
  }
}

function handleTouchEnd(event) {
    mousePos = {x:windowHalfX, y:windowHalfY};
    updateSpeed();
}

function handleTouchMove(event) {
  if (event.touches.length == 1) {
    //event.preventDefault();
		mousePos = {x:event.touches[0].pageX, y:event.touches[0].pageY};
    updateSpeed();
  }
}

function loop() {

  // Update fish position, rotation, scale... depending on the mouse position
  // To make a smooth update of each value I use this formula :
  // currentValue += (targetValue - currentValue) / smoothing

  //SpeedPurity depends from pollution rate calculated
  var speedPurity=0;
  var scalePurity=0;
  if(params.polluted){
    speedPurity=(maxPollution-params.waterPollution-50)/200;
    scalePurity=(maxPollution-params.waterPollution-50)/250;
    if(params.plastic){
      speedPurity+=25/200;
    }
    if(params.chemical){speedPurity+=25/200;}



  }else{
    speedPurity=(maxPollution-maxPollution)/100;
  }



  // make the fish swing according to the mouse direction
  //fish.rotation.y=0;
  fish.rotation.z += ((-speed.y/50)-fish.rotation.z)/smoothing;
  fish.rotation.x += ((-speed.y/50)-fish.rotation.x)/smoothing;
  fish.rotation.y += ((-speed.y/50)-fish.rotation.y)/smoothing;

  // make the fish move according to the mouse direction
  fish.position.x += (((mousePos.x - windowHalfX)) - fish.position.x) / smoothing;
  fish.position.y += ((-speed.y*10)-fish.position.y)/smoothing;

  // make the eyes follow the mouse direction
  rightEye.rotation.z = leftEye.rotation.z = -speed.y/150;
  rightIris.position.x = leftIris.position.y = -10 - speed.y/2;

  // make it look angry when the speed increases by narrowing the eyes
  rightEye.scale.set(1,1-(speed.x/200)-scalePurity,1);
  leftEye.scale.set(1,1-(speed.x/200)-scalePurity,1);

  //rightEye.scale.set(1,1-(speedPurity),1);
  //leftEye.scale.set(1,1-(speedPurity),1);

  // in order to optimize, I precalculate a smaller speed values depending on speed.x
  // these variables will be used to update the wagging of the tail, the color of the fish and the scale of the fish
  var s2 = speed.x/100; // used for the wagging speed and color
  var s3 = speed.x/300; // used for the scale



  //console.log(speedPurity);


  // I use an angle that I increment, and then use its cosine and sine to make the tail wag in a cyclic movement. The speed of the wagging depends on the global speed
  angleFin += s2;
  // for a better optimization, precalculate sine and cosines
  var backTailCycle = Math.cos(angleFin);
  var sideFinsCycle = Math.sin(angleFin/5);

  tailFish.rotation.y = backTailCycle*.5;
  topFish.rotation.x = sideFinsCycle*.5;
  sideRightFish.rotation.x = halfPI + sideFinsCycle*.2;
  sideLeftFish.rotation.x = halfPI + sideFinsCycle*.2;

  // color update depending on the speed
  var rvalue = (fishSlowColor.r + (fishFastColor.r - fishSlowColor.r)*speedPurity)/255;
  //console.log(rvalue);
  var gvalue = (fishSlowColor.g + (fishFastColor.g - fishSlowColor.g)*speedPurity)/255;
  var bvalue = (fishSlowColor.b + (fishFastColor.b - fishSlowColor.b)*speedPurity)/255;
  bodyFish.material.color.setRGB(rvalue,gvalue,bvalue);
  lipsFish.material.color.setRGB(rvalue,gvalue,bvalue);

  //scale update depending on the speed => make the fish struggling to progress
  fish.scale.set(1+s3,1-s3,1-s3);

  // particles update
  for (var i=0; i<flyingParticles.length; i++){
    var particle = flyingParticles[i];
    particle.rotation.y += (1/particle.scale.x) *.05;
    particle.rotation.x += (1/particle.scale.x) *.05;
    particle.rotation.z += (1/particle.scale.x) *.05;
    particle.position.x += -10 -(1/particle.scale.x) * speed.x *.2;
    particle.position.y += (1/particle.scale.x) * speed.y *.2;
    if (particle.position.x < -xLimit - 80){ // check if the particle is out of the field of view
      scene.remove(particle);
      flyingParticles.splice(i,1)[0];
      //waitingParticles.push(flyingParticles.splice(i,1)[0]); // recycle the particle
      i--;
    }
  }
  renderer.render(scene, camera);
  if(params.debug){
    stats.domElement.hidden=false;
    stats.update();
  }else{
    stats.domElement.hidden=true;
  }


  requestAnimationFrame(loop);
}

function getParticle(){
  /*if (waitingParticles.length) {
    return waitingParticles.pop();
  }else{

  }*/
  return createParticle();
}

function flyParticle(){
  var particle = getParticle();

  // set the particle position randomly but keep it out of the field of view, and give it a random scale
  particle.position.x = xLimit;
  particle.position.y = -yLimit + Math.random()*yLimit*2;
  particle.position.z = Math.random()*maxParticlesZ;
  var s = .1 + Math.random();
  particle.scale.set(s,s,s);
  flyingParticles.push(particle);
 	scene.add(particle);
  //counter *= 10;
  setTimeout(flyParticle, params.waterPollution);

}

function getRandomColor(){
  var col = hexToRgb(colors[Math.floor(Math.random()*colors.length)]);
  var threecol = new THREE.Color("rgb("+col.r+","+col.g+","+col.b+")");
  return threecol;
}


function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}



function updateSpeed(){
  speed.x = (mousePos.x / WIDTH)*100;

  speed.y = (mousePos.y-windowHalfY) / 10;
}
