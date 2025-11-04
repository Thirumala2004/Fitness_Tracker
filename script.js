const form = document.querySelector('.form');
const workouts = document.querySelector('.workouts');
const act_name = document.querySelector('.form_input-type');
const act_dist = document.querySelector('.form_input-distance');
const act_time = document.querySelector('.form_input-duration');
const act_cylce = document.querySelector('.form_input-cadence');
const act_walk = document.querySelector('.form_input-sps');
const form_submit = document.querySelector('.form_btn');
const spec = document.querySelectorAll('.spec');
// console.log(spec);
let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    // this._setDesc();
  }

  _setDesc(){
    const months = ['Jan','Feb','Mar','Apr','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this.desc = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;

  }

}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcSpeed();
    this._setDesc();
  }
  calcSpeed() {
    this.speed = this.duration / (this.distance / 60);
  }
  
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, sps) {
    super(coords, distance, duration);
    this.sps = sps;
    this.calcPace();
    this._setDesc();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }

}

class Walking extends Workout {
  type = 'walking';
  constructor(coords, distance, duration, sps) {
    super(coords, distance, duration);
    this.sps = sps;
    this.calcPace();
    this._setDesc();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }

}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #zoomLevel = 13;
  constructor() {
    this._getPosition();
    form_submit.addEventListener('click', this._newWorkout.bind(this));
    act_name.addEventListener('change', this._toggleElevationField);
    workouts.addEventListener('click',this._moveToPopup.bind(this));
    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your Accurate location");
        }
      );
  }

  _loadMap(pos) {
    const { latitude, longitude } = pos.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    console.log('Loading the Map..');

    this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work);
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    const { lat, lng } = this.#mapEvent.latlng;
    form.classList.remove('hidden');
    act_dist.focus();
  }

  _toggleElevationField(e) {
    console.log(spec);
    spec.forEach(function (ele) {
      ele.classList.add('form_ip--hidden');
    });
    // console.log(e);
    if (act_name.value === 'cycling') {
      // console.log(act_cylce.closest('.spec'));
      act_cylce.closest('.spec').classList.remove('form_ip--hidden');
    } else {
      console.log(act_walk);
      act_walk.closest('.spec').classList.remove('form_ip--hidden');
    }
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp>0);
    e.preventDefault();

    const type = act_name.value;
    const dist = +act_dist.value;
    const duration = +act_time.value;
    const {lat, lng} = this.#mapEvent.latlng;
    let workout;

    if(type === 'cycling'){
        const cadence = +act_cylce.value;
        if(!validInputs(dist,duration,cadence) || !allPositive(dist,duration))
            return alert("Give Valid inputs")
        workout = new Cycling([lat,lng],dist,duration,cadence);
    }
    if(type === 'running'){
        const sps = +act_walk.value;
        if(!validInputs(dist,duration,sps) || !allPositive(dist,duration))
            return alert('Enter Valid Inputs');
        workout = new Running([lat,lng],dist,duration,sps);
    }
    if(type === 'walking'){
        const sps = +act_walk.value;
        if(!validInputs(dist,duration,sps) || !allPositive(dist,duration))
            return alert('Enter Valid Inputs');
        workout = new Walking([lat,lng],dist,duration,sps);
    }
    this.#workouts.push(workout);
    console.log(workout);

    this._renderWorkout(workout);
    this._renderWorkoutMarker(workout);

    act_dist.value = act_time.value = act_cylce.value = act_walk.value =  '';

    this._setLocalStorage();
    form.classList.add('hidden');
  }

  _renderWorkoutMarker(workout){
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `workout--${Workout.type}`
        })
      )
      .setPopupContent(`${workout.type === 'cycling' ?'🚴‍♀️':'🏃‍♂️'} ${workout.desc}`)
      .openPopup();
  }

  _renderWorkout(workout){
    let html = `

        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.desc}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'cycling'?'🚴‍♀️': workout.type === 'running'?'🏃‍♂️': '👣'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
    `;
    if(workout.type === 'cycling')
        html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(0)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦾</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">km/h</span>
            </div>
        </li>
        
        `;
    if(workout.type === 'running')
        html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦾</span>
                <span class="workout__value">${workout.sps}</span>
                <span class="workout__unit">km/h</span>
            </div>
        </li>
        
        `;
        console.log(html);
        form.insertAdjacentHTML('afterend',html);
  }
  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);
    if(!workoutEl)  return;
    const workout = this.#workouts.find(
        work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords,this.#zoomLevel,{
        animate: true,
        pan: {
            duration: 2
        }
    })
  }
  
  _setLocalStorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workouts));
  }
  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if(!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work =>{
        this._renderWorkout(work);
    })
  }
}

const app = new App();