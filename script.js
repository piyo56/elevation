/*
   グローバル変数
   map : GoogleMapの本体
   origin : 出発地の情報
   destination : 目的地の情報
*/

$(document).ready(function() {
    init();
});
$(document).on("click", "#search_button",  function(){
    main();
});

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
}

//--------------------------------------
// 場所名(または住所)から座標に変換
//--------------------------------------
function geocode(place, _callback){
    console.log("geocode()");
    GMaps.geocode({
        region: "jp",
        address: place,
        callback: function(results, status) {
            if (status !== void 0 && status !== 'OK') {
                swal("申し訳ありません", place + "の住所が取得できませんでした. \n(Google Maps API error! Status =>" + status +")", "error");
            }
            var latlng = results[0].geometry.location;
            var lat = latlng.lat();
            var lng = latlng.lng();
            //console.log("local variable");
            //console.log([lat, lng]);
            _callback([lat, lng]);
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
            //ルートを取得
            map.getRoutes({
                origin:      origin["latlng"],
                destination: destination["latlng"],
                callback: function(results, status){
                    if (status !== void 0 && status !== 'OK') {
                        swal("申し訳ありません","ルートの取得に失敗しました。\n(Google Maps API error! Status:" + status + ")","error");
                        return;
                    }
                    console.log(results);
                    var pathObject = results[results.length-1].overview_path;
                    var path = [];

                    console.log(origin["place"]+" -> "+destination["place"]);
                    console.info("latlng of org: ", origin["latlng"]);
                    console.info("latlng of dest: ", destination["latlng"]);
                    console.info("path(lat):");
                    for (var i=0; i<3; i++){
                        console.log(pathObject[i].lat());
                    }

                    for (var i=0; i<pathObject.length; i++){
                        path.push([pathObject[i].lat(), pathObject[i].lng()]);
                    }
                    _callback(path);
                }
            });
        });
    });
}

//--------------------------------------
// 出発地から目的地までのルートを描画する
//--------------------------------------
function drawRoute(){
    console.log("drawRoute()");
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
}

//--------------------------------------
// 出発地から目的地までの標高を取得する
//--------------------------------------
function getElevation(path, _callback){
    console.log("getElevation()");
    map.getElevations({
        locations: path,
        callback : function(results, status){
            if (status !== void 0 && status !== 'OK') {
                swal("申し訳ありません", "標高の取得に失敗しました。\n(Google Maps API error! Status: " + status +")", "error");
                return;
            }
            _callback(results);
        }
    });
}

//--------------------------------------
// ルートに沿った標高を描画する
//--------------------------------------
function plotElevation(api_results){
    console.log("plotElevation()");
    $("#graph").empty();

    //描画フォーマットに合わせた標高の配列をつくる
    var x_data = [];
    var elevations = [];
    for (var i=0; i<api_results.length; i++){
        x_data.push(i);
        elevations.push(api_results[i]["elevation"]);
    }
    console.info("plot_data_num: " + x_data.length);
    route1 = {
        type: "scatter",
        x: x_data,
        y: elevations,
        mode:"markers+lines",
        marker:{size:1},
        line: {
            color: "green",
            width: 1.5
        }
    };

    //描画
    var data = [route1];
    var layout = {
        xaxis: {
            zeroline: false, 
            range: [-1, elevations.length+1],
            title: "位置 (出発地から目的地)",
            gridcolor: "#FFFFFF", 
            nticks: 5, 
            showgrid: true,
        },
        yaxis: {
            zeroline: false,
            title: "標高 [m]",
            gridcolor: "#FFFFFF", 
            nticks: 5, 
            showgrid: true,
        },
        hovermode:'closest',
        plot_bgcolor: "#EFECEA", 
        showlegend: false, 
        margin: { l: 40, b: 40, r:10, t:10 }
    };
    Plotly.newPlot($("#graph")[0], data, layout);
    
    //マウスオーバー処理
    //  var chartDiv = document.getElementById('chart-div');
    //  chartDiv.on('plotly_hover', function(data){
    //との違い よくわからない
    $("#graph")[0].on("plotly_hover", function(e){
        console.info("hover_envent: ", e);
        var points = e.points[0];
        var pointNum = points.pointNumber;
        var latlng = api_results[pointNum].location;
        console.info(e);
        map.addMarker({
            lat: latlng.lat(),
            lng: latlng.lng()
        });
    }).on("plotly_unhover", function(){
        map.removeMarkers();
    });
}

//-----------------------------------------------
// メイン関数
// # 検索ボタンが押された時に走る
//-----------------------------------------------
function main(){
    console.log("----------------------------------------");
    console.log("main()");
    
    $("#graph").css("border", "none");
    //出発地,目的地の名前を取得
    origin = {
        "place" : $("#origin").val(),
        "latlng" : []
    };
    console.log("main()");

    destination = {
        "place" : $("#destination").val(),
        "latlng" : []
    };
    if(origin["place"] === '' || destination["place"] === ''){
        swal('出発地または目的地が入力されていません',"warning");
        return;
    }
    map.removeMarkers();
    map.cleanRoute();

    //ルート取得 -> ルートの描画 -> 標高取得 -> 標高の描画
    getRoute(function(path){
        drawRoute();
        getElevation(path, function(elevations){
            plotElevation(elevations);
        });
    });
}
