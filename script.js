/*
   グローバル変数
   map : GoogleMapの本体
   origin : 出発地の情報
   destination : 目的地の情報
*/

//window.addEventListener("load", init(), false);
$(waitForEvent);
function waitForEvent(){
    init();
    //$(ターゲット).click()でなく$(document).on()をうまくいく
    $(document).on("click", "#search_button",  function(){
        main();
    });
};
//-----------------------------------------------
// 初期化関数
// # ウィンドウがロードされた時に走る
//-----------------------------------------------
function init(){
    console.log("init()");
    map = new GMaps({
        div: "#map",
        lat: 35.681382,
        lng: 139.766084,
        zoom: 15
    });

    map.addMarker({
        lat: 35.681382,
        lng: 139.766084,
        title: "東京駅"
    });
};

//--------------------------------------
// 場所名(または住所)から座標に変換
//--------------------------------------
function geocode(place, _callback){
    console.log("geocode()")
        GMaps.geocode({
            region: "jp",
            address: place,
            callback: function(results, status) {
                if (status == 'OK') {
                    var latlng = results[0].geometry.location;
                    var lat = latlng.lat();
                    var lng = latlng.lng();
                    //console.log("local variable");
                    //console.log([lat, lng]);
                    _callback([lat, lng]);
                } else {
                    console.log("Geocode got Error. Status => " + status);
                }
            }
        });
}

//--------------------------------------
// 出発地から目的地までのルートを取得する
//--------------------------------------
function getRoute(_callback){
    console.log("getRoute()");

    //地名から座標に
    geocode(origin["place"], function(results){
        origin["latlng"] = results;
        geocode(destination["place"], function(results){
            destination["latlng"] = results;
            //console.log(origin["latlng"], destination["latlng"]);
            //ルートを取得
            map.getRoutes( {
                origin:      origin["latlng"],
                destination: destination["latlng"],
                callback: function(results){
                    var pathObject = results[0].overview_path
                        var path = []
                        console.log(results)
                        console.log("path (lat) test");
                    console.log(origin["place"]+"->"+destination["place"])
                        console.log(pathObject[0].lat());
                    console.log(pathObject[1].lat());
                    console.log(pathObject[2].lat());
                    for (var i=0; i<pathObject.length; i++){
                        path.push([pathObject[i].lat(), pathObject[i].lng()])
                    }
                    _callback(path);
                }
            })
        });
    });
};

//--------------------------------------
// 出発地から目的地までのルートを描画する
//--------------------------------------
function drawRoute(){
    console.log("drawRoute()")
    map.drawRoute({
        origin: origin["latlng"],
        destination: destination["latlng"],
        travelMode: 'walking',
        strokeColor: '#228b22',
        strokeOpacity: 0.6,
        strokeWeight: 6
    });
    map.addMarker({
        lat: origin["latlng"][0],
        lng: origin["latlng"][1],
        title: origin["place"]
    });
    map.addMarker({
        lat: destination["latlng"][0],
        lng: destination["latlng"][1],
        title: destination["place"]
    });
    var newCenterLat = (destination["latlng"][0] - origin["latlng"][0]) / 2 + origin["latlng"][0];
    var newCenterLng = (destination["latlng"][1] - origin["latlng"][1]) / 2 + origin["latlng"][1];
    map.setCenter({
        lat: newCenterLat, lng: newCenterLng
    });
    map.fitZoom();
};

//--------------------------------------
// 出発地から目的地までの標高を取得する
//--------------------------------------
function getElevation(path, _callback){
    console.log("getElevation()");
    map.getElevations({
        locations: path,
        callback : function(results, status){
            if (status == "OK") {
                _callback(results);
            } else {
                alert("標高の取得に失敗しました。。。" + status)
                    return;
            }
        }
    });
};

//--------------------------------------
// ルートに沿った標高を描画する
//--------------------------------------
function plotElevation(gmap_results){
    console.log("plotElevation()");

    //描画フォーマットに合わせた標高の配列をつくる
    var elevations = [{"x":[], "y":[]}];
    for (var i=0 ; i<gmap_results.length; i++){
        elevations[0]["x"].push(i);
        elevations[0]["y"].push(gmap_results[i].elevation);
    }

    //描画
    TESTER = document.getElementById('graph');
    Plotly.plot( TESTER, elevations, {
        //margin: { t: 0 }
    });

    /*
    elevations.push({ "place":origin["place"],
                      "value":results[0].elevation });
    elevations.push({ "place": destination["place"],
                      "value": results[i].elevation});
    */
}

//-----------------------------------------------
// メイン関数
// # 検索ボタンが押された時に走る
//-----------------------------------------------
function main(){
    console.log("main()");

    //出発地,目的地の名前を取得
    origin = {
        "place" : $(origin).val(),
        "latlng" : []
    };
    destination = {
        "place" : $(destination).val(),
        "latlng" : []
    };
    if(origin["place"] === '' || destination["place"] === ''){
        alert('出発地または目的地が入力されていません');
        return;
    }
    console.log("org: ", origin["place"], "dest: ", destination["place"]);
    map.removeMarkers();
    map.cleanRoute();

    //ルート取得 -> ルートの描画 -> 標高取得 -> 標高の描画
    getRoute(function(path){
        drawRoute();
        getElevation(path, function(elevations){
            plotElevation(elevations);
        });
    });
};
