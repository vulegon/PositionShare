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

//スマホの画面に合わせるためにGoogleMapの画面の高さを調整
$(document).ready(function() {
  var hsize = $(window).height();
  $("#target").height(hsize);
});
$(window).resize(function() {
  var hsize = $(window).height();
  $("#target").height(hsize);
});

var target = document.getElementById('target');
var map;
var marker = []; //marker[0]は現在地、[1]は目的地
var home_position = { lat: 0, lng: 0 }; /*仮の現在地の座標*/
const db = firebase.firestore();
const collection = db.collection('pindata');
var delete_id = [];
var currentState = "IS_INITIALIZED"; //初期の状態
var marker_count = 2; //マーカーを打てる最大値
var firebase_marker = [];

function initMap() {
  //ブラウザが現在位置の取得(Geolocation)に対応しているかどうかの判定
  //対応しているならその位置を取得。取れないなら終了。
  if (!navigator.geolocation) {
    alert("ブラウザが現在位置の取得(Geolocation)に未対応です。現在地が正確に特定できません。");
    return false;
  }
  else {
    get_current_position();
  }
}
//現在の位置をgetCurrentPositionでリアルタイムに取得する。positionに現在の位置が入る
function get_current_position() {
  navigator.geolocation.getCurrentPosition(function(position) {
      // //Firebaseに保存してあるデータの取得
      collection.get().then((querySnapshot) => {
        //Firebaseに保存されている緯度経度を一個一個取り出してGooglemapにピンを打つ
        querySnapshot.forEach((doc) => {
          if (doc.data().hasOwnProperty("icon")) {
            firebase_marker.push(new google.maps.Marker({
              position: { lat: doc.data().latitude, lng: doc.data().longitude },
              map: map,
              icon: doc.data().icon
            }));
          }
          else {
            firebase_marker.push(new google.maps.Marker({
              position: { lat: doc.data().latitude, lng: doc.data().longitude },
              map: map,
            }));
          }
        });
        if (querySnapshot.size >= 1) {
          $("#all_delete_button").css("opacity", "1");
          $("#all_delete_button").on("click", all_delete_process);
          $("#all_delete_button").addClass("active");
          console.log("全部削除ボタンを有効");
        }
        else {
          $("#all_delete_button").css("opacity", "0.3");
          console.log("全部削除ボタンを無効");
        }
      }).catch((error) => {
        console.log(`データの取得に失敗しました${error}`);
      });
      //現在の位置を位置情報を元に設定 latに緯度lngに経度
      home_position.lat = position.coords.latitude;
      home_position.lng = position.coords.longitude;

      if (currentState === "IS_INITIALIZED") {
        //地図の中心を設定する
        map = new google.maps.Map(target, {
          // 地図の中心点
          center: home_position,
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        });
      }

      //初期マーカーを設定 
      marker[0] = new google.maps.Marker({
        position: home_position,
        map: map,
      });

      //クリックイベントを追加。
      map.addListener("click", function(e) {
        if (marker.length < marker_count) {
          marker[1] = click_Marker(e);
        }
        else {
          //既にマーカーを配置しているときはそれを削除し、新たなマーカーをセット
          marker.slice(-1)[0].setMap(null);
          marker[1] = click_Marker(e);
        }
      });
      if(currentState==="IS_INITIALIZED"　|| currentState==="IS_COMPLETE"){
      //Firebaseに保存できるボタンのイベントを追加
      $("#create_link").on("click", share_process);
      $("#create_link").addClass("active");
      }
    },
    function() {
      alert("ブラウザが現在位置の取得(Geolocation)に失敗しました。");
    });
}

function click_Marker(e) {
  var click_marker = new google.maps.Marker({
    position: e.latLng,
    map: map,
    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  });
  return click_marker;
}

//リンクをクリックした時にマーカーのデータをFirebaseに保存する
const share_process = function(e) {
  e.preventDefault();
  console.log("保存の処理に入りました");
  for (let i = 0; i < marker.length; i++) {
    //緑ピンの保存
    if (marker[i].hasOwnProperty("icon")) {
      collection.add({
          //緯度
          latitude: marker[i].getPosition().lat(),
          //経度
          longitude: marker[i].getPosition().lng(),
          created: firebase.firestore.FieldValue.serverTimestamp(),
          icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        })
        //データの保存に成功したときの処理 
        .then(doc => {
          console.log("緑ピンのデータの保存に成功");
        })
        // //エラーが起きたときの処理
        .catch(error => {
          console.log("Firebaseのデータベースへの保存に失敗しました。");
        });
    }
    //緑ピンでは無いデータの保存
    else {
      collection.add({
          //緯度
          latitude: marker[i].getPosition().lat(),
          //経度
          longitude: marker[i].getPosition().lng(),
          created: firebase.firestore.FieldValue.serverTimestamp(),
        })
        //データの保存に成功したときの処理 
        .then(doc => {
          console.log("赤ピンの保存に成功");
          $(".undo_outer_border").css("opacity", "1");
          $("#undo_button").on("click", undo_process);
          $("#undo_button").addClass("active");
          
          $('#create_link').off("click");
          $('#create_link').removeClass("active");
          $("#create_link").css("opacity", "0.3");
          
          if(!$("#all_delete_button").hasClass("active")){
          $("#all_delete_button").css("opacity", "1");
          $("#all_delete_button").on("click", all_delete_process); 
          $("#all_delete_button").addClass("active");
          }

        })
        // //エラーが起きたときの処理
        .catch(error => {
          console.log("Firebaseのデータベースへの保存に失敗しました。");
        });
    }
  }

  //保存した時に出るメッセージ
  const save_message = document.createElement('div');
  save_message.className = "save_message";
  target.appendChild(save_message);
  save_message.innerHTML = `<span class="fas fa-check"></span>現在地と目的地を保存しました。`;
  $.when(
    $(".save_message").slideDown().delay(1000),
    $(".save_message").slideUp()
  ).done(function() {
    $('.save_message').remove();
  });
};

//元に戻すボタン
const undo_process = function() {
  //今の状態をUNDOに設定
  currentState = "IS_UNDO";

  delete_function().then(() => {
    console.log("undoの処理終了しているはずです。");
    //現在地と立てたピンを削除
    marker.length = 0;

    console.log("create_linkのclickイベントを有効にしました");
    $("#create_link").css("opacity", "1");
    $('#create_link').on("click");
    $('#create_link').addClass("active");

    console.log("UNDO無効にしました");
    $("#undo_button").css("opacity", "0.3");
    $('#undo_button').off("click");
    $("#undo_button").removeClass("active");

    if($("#all_delete_button").hasClass("active") && firebase_marker.length === 0){
      $("#all_delete_button").css("opacity", "0.3");
      $("#all_delete_button").off("click"); 
      $("#all_delete_button").removeClass("active");
      }
    currentState="IS_COMPLETE";
    //現在地の取得のために呼び出す。
    get_current_position();

  });
};
async function delete_function() {
  await get_delete_id();
  await delete_process();
}

function get_delete_id() {
  return new Promise(function(resolve, reject) {
    var counter = 0; //消すピンは2つまで
    //firebaseにあるデータをcreated(保存日)で降順に並び替える
    collection.orderBy("created", "desc").get().then((querySnapshot) => {
      //Firebaseに保存されているピンの情報を一個一個取り出して削除するIDを取得
      querySnapshot.forEach((doc) => {
        if (counter < 2 && currentState === "IS_UNDO") {
          delete_id[counter] = doc.id;
          // console.log("元に戻す削除ー削除するID:" + delete_id[counter]);
        }
        else if (currentState === "IS_ALL_DELETE") {
          delete_id[counter] = doc.id;
          // console.log("全部削除ー削除するID:" + delete_id[counter]);
        }
        counter++;
      });
      console.log("削除IDの取得");
      resolve();
    }).catch((error) => {
      console.log(`データの取得に失敗しました${error}`);
    });
  });
}

function delete_process() {
  return new Promise(function(resolve, reject) {
    console.log("削除の処理");

    var promiselist = [];
    if (currentState === "IS_UNDO") {
      for (let i = 0; i < marker.length; i++) {
        marker[i].setMap(null);
        promiselist.push(collection.doc(delete_id[i]).delete().then(() => {
          console.log("マーカー削除:" + delete_id[i]);

        }).catch((error) => {
          console.error("削除に失敗: ", error);
        }));
      }
    }
    else if (currentState === "IS_ALL_DELETE") {
      if(marker[0]){
        marker[0].setMap(null);
        console.log("現在地のピン削除");
      }
      if(marker[1]){
        marker[1].setMap(null);  
        console.log("目的地のピン削除"); 
      }
      
      if(firebase_marker.length > 0){
        for(let j=0;j<firebase_marker.length;j++){
          firebase_marker[j].setMap(null);
          console.log("firebaseのマーカーの削除の処理"+j+"回目"); 
        }
      }
      for (let i = 0; i < delete_id.length; i++) {
        promiselist.push(collection.doc(delete_id[i]).delete().then(() => {
          console.log("マーカー削除:" + delete_id[i]);
        }).catch((error) => {
          console.error("削除に失敗: ", error);
        }));
      }
    }
    Promise.all(promiselist).then(() => {
      resolve();
    });
  });
}

function all_delete_process() {
  currentState = "IS_ALL_DELETE";
  delete_function().then(() => {
    console.log("削除IDの取得、ピンの削除完了");
    //現在地と立てたピンを削除
    marker.length = 0;
    firebase_marker.length = 0;

    currentState="IS_COMPLETE";
    if(!$("#create_link").hasClass("active")){
    console.log("create_linkのclickイベントを有効にしました");
    $("#create_link").css("opacity", "1");
    $("#create_link").on("click", share_process);
    $("#create_link").addClass("active");
      currentState="IS_INITIALIZE_DELETE";
    }else{
      currentState="IS_INITIALIZE_DELETE";
    }
    
    console.log("ALL_DELETE無効にしました");
    $("#all_delete_button").css("opacity", "0.3");
    $('#all_delete_button').off("click");
    $('#all_delete_button').removeClass("active");

    if($("#undo_button").hasClass("active")){
      $("#undo_button").css("opacity", "0.3");
      $('#undo_button').off("click");
      $("#undo_button").removeClass("active");
    }

    //現在地の取得のために呼び出す。
    get_current_position();

  });
}
