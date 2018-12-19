import firebase from 'firebase/app';
import 'firebase/database';

const config = {
    apiKey: "AIzaSyC0CGHEBDofGe3QxKtq4t5tk_EnRDkOehQ",
    authDomain: "bgkp-game-picker.firebaseapp.com",
    databaseURL: "https://bgkp-game-picker.firebaseio.com",
    projectId: "bgkp-game-picker",
    storageBucket: "bgkp-game-picker.appspot.com",
    messagingSenderId: "90943680008"
};
const fire = firebase.initializeApp(config);
export default fire;
