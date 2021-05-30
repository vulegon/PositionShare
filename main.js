//firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyA5mP5kMhpC_v3BwBRf2E63fmoLtsfK4Ps",
  authDomain: "portforiomap.firebaseapp.com",
  projectId: "portforiomap",
  storageBucket: "portforiomap.appspot.com",
  messagingSenderId: "94075331815",
  appId: "1:94075331815:web:6e10e4f5ec7eb7d40c6e42",
  measurementId: "G-PTKQCYXZ77"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//スマホの画面ようにGoogleMapの画面の高さを調整
$(document).ready(function () {
  var hsize = $(window).height();
  $("#target").height(hsize);
});
$(window).resize(function () {
   var hsize = $(window).height();
  $("#target").height(hsize);
});

function initMap() {
  'use strict';
  var target = document.getElementById('target');
  var map;
  var marker = [];
  var home_position = { lat: 0, lng: 0 };  /*仮の現在地の座標*/
  const db = firebase.firestore();
  const collection = db.collection('pindata');
  var undo_count=0;

  
  //ブラウザが現在位置の取得(Geolocation)に対応しているかどうかの判定
  //対応しているならその位置を取得。取れないなら終了。
  if (!navigator.geolocation) {
    alert("ブラウザが現在位置の取得(Geolocation)に未対応です。現在地が正確に特定できません。");
    return false;
  }
  else {
    //現在の位置をwatchPositionでリアルタイムに取得する
    // var watchId = navigator.geolocation.watchPosition(function(position) {
    navigator.geolocation.getCurrentPosition(function(position) {
    //Firebaseに保存してあるデータの取得
    collection.get().then((querySnapshot)=>{
     querySnapshot.forEach((doc) => {
       if(doc.data().hasOwnProperty("icon")){
         new google.maps.Marker({
         position: { lat: doc.data().latitude, lng: doc.data().longitude },
         map: map,
         icon:doc.data().icon,
      });
       }else{
         new google.maps.Marker({
         position: { lat: doc.data().latitude, lng: doc.data().longitude },
         map: map,
         });
       }
      
    }); 
    }).catch((error)=>{
      console.log(`データの取得に失敗しました${error}`);
    });
    

      //現在の位置を位置情報を元に設定 latに緯度lngに経度
      home_position.lat = position.coords.latitude;
      home_position.lng = position.coords.longitude;
      
      //地図の中心を設定する
      map = new google.maps.Map(target, {
      // 地図の中心点
      center: home_position,
      zoom: 15,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      });
      //初期マーカーを設定 
      marker[0] = new google.maps.Marker({
      position: home_position,
      map: map,
      });

    //ピンを打てる数は最大1個まで。marker_countに表示されているピン+1の変数を入れておく
    var marker_count = 2;
    //クリックした時にマーカーを追加
    map.addListener("click", function(e) {
    if (marker.length < marker_count) {
      marker[1]=new google.maps.Marker({
        position: e.latLng,
        map: map,
        icon:"https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
    }
    else {
      //既にマーカーを配置しているときはそれを削除し、新たなマーカーをセット
      marker.slice(-1)[0].setMap(null);
      marker[1]=new google.maps.Marker({
        position: e.latLng,
        map: map,
        icon:"https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      });
    }
    });
        
  const undo_outer_border = document.createElement('div');
  const undo_inner_border = document.createElement('div');
  const undo_icon = document.createElement('span');
  undo_icon.className="fa fa-undo-alt";
  undo_inner_border.className="undo_inner_border";
  undo_outer_border.className="undo_outer_border";
  undo_inner_border.appendChild(undo_icon);
  undo_outer_border.appendChild(undo_inner_border);
  target.appendChild(undo_outer_border);
  }, 
  function() {
      alert("ブラウザが現在位置の取得(Geolocation)に失敗しました。");
  });
  }
   //リンクをクリックした時にマーカーのデータをFirebaseに保存する
  const createLink = document.getElementById("create_link");
  createLink.addEventListener("click",function(e){
    e.preventDefault();
    console.log("保存の処理に入りました");
    for(let i=0;i<marker.length;i++){
      if(marker[i].hasOwnProperty("icon")){
        collection.add({
      //緯度
      latitude:marker[i].getPosition().lat(),
      //経度
      longitude:marker[i].getPosition().lng(),
      created: firebase.firestore.FieldValue.serverTimestamp(),
      icon:"https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      })
        //データの保存に成功したときの処理 
      .then(doc=>{
          console.log("Firebaseのデータベースに保存しました。");
      })
      // //エラーが起きたときの処理
      .catch(error=>{
          console.log("Firebaseのデータベースへの保存に失敗しました。");
      });
      }
      else{
      collection.add({
      //緯度
      latitude:marker[i].getPosition().lat(),
      //経度
      longitude:marker[i].getPosition().lng(),
      created: firebase.firestore.FieldValue.serverTimestamp(),
      })
        //データの保存に成功したときの処理 
      .then(doc=>{
          console.log("Firebaseのデータベースに保存しました。");
      })
      // //エラーが起きたときの処理
      .catch(error=>{
          console.log("Firebaseのデータベースへの保存に失敗しました。");
      });
      }
    }
    undo_count = 1;

    //保存した時に出るメッセージ
    const save_message = document.createElement('div'); 
    save_message.className="save_message";
    target.appendChild(save_message);
    save_message.innerHTML=`<span class="fas fa-check"></span>現在地と目的地を保存しました。`;
    $.when(
    $(".save_message").slideDown().delay(1000),
    $(".save_message").slideUp()
    ).done(function(){ 
    $('.save_message').remove();
    });
    });

}
