"use strict";
/*
         二重数四則演算グラフクラス＆その他ライプラリ
         Date             Version  Note
         2024.10.16   1.0        初版
        
         JSXGraphを使うために<head>に以下の2行を追加しておくこと
         link要素 rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.1.0/jsxgraph.min.css"
         script要素 src="https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.1.0/jsxgraphcore.min.js" 
        */

//debug用出力関数
// msg:エラーメッセージ, outputAreaName: div領域のid
function errOut(msg, outputAreaName) {
  var div = document.getElementById(outputAreaName);
  div.innerHTML = "err_msg [" + msg + "]";
}

// 二重数四則演算描画クラス
// 生成時、引数にdiv要素のidを指定。
// 注意点：
// ①<head>でjsxgraphのCDNの参照の追加が必要
// ②selection要素のidが"patternSelect”に列挙される以下の５つについて計算結果をグラフに表示
//<select id="patternSelect">
// option value="sum">z_1+z_2</option>
//<option value="mul">z_1 z_2</option>
//<option value="inv">1/z</option>
//<option value="div">z_1/z_2</option>
//<option value="div_i">b_1ε/b_2ε</option>
//</select>
class DualNumberOperation {
  name;
  board;
  pointA;
  pointB;
  point; //計算結果のポイント
  selectElement;
  pattern;
  patternText;
  pointResult; //計算結果の値を常に格納
  //                dragPoint; //ドラッグされたPointオブジェクトを常に保持。デフォルトはPointAを設定。
  constructor(figureId) {
    this.name = this.constructor.name; //このクラスのクラス名を設定
    // JSXGraphのボードを初期化:対象のfigure領域をfigureIdで指定
    this.board = JXG.JSXGraph.initBoard(figureId, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false, // コピーライト文字列を表示しない
      defaultAxes: {
        //各軸のラベルを表示
        x: {
          name: "Re(z)",
          withLabel: true,
          label: {
            position: "rt", // right-top (x軸の右上)
            offset: [-20, 20],
          },
        },
        y: {
          name: "Im(z)",
          withLabel: true,
          label: {
            position: "rt", // top (y軸の上)
            offset: [10, -10],
          },
        },
      },
    });
    this.board.name = figureId; //ボードにカスタムプロパティでnameプロパティを追加・設定。
    // 2つのドラッグ可能な点を作成
    this.pointA = this.board.create("point", [1, 1], {
      name: "z_1",
      size: 4,
      color: "red",
    });
    this.pointB = this.board.create("point", [-1, -1], {
      name: "z_2",
      size: 4,
      color: "blue",
    });
    this.pointResult = { x: 0, y: 0 };
    // selectボックスの値を取得
    this.getPattern();
    //               this.onChange();
    // 初期位置計算
    this.operationLoc(this.pointA); //計算結果の座標を更新
    this.point = this.board.create(
      "point",
      [this.pointResult.x, this.pointResult.y],
      {
        name: this.patternText,
        size: 4,
        color: "green",
        fixed: true,
        visible: true,
      }
    ); // fixed : true ドラッグ不可

    // 直線
    // 2つの直線操作用の点を作成
    this.lpA = this.board.create("point", [2, 1], {
      name: "l_1",
      size: 4,
      color: "blue",
      fixed: true,
      visible: false,
    });
    this.lpB = this.board.create("point", [2, -1], {
      name: "l_2",
      size: 4,
      color: "pink",
      fixed: true,
      visible: false,
    });
    this.line = this.board.create("line", [this.lpA, this.lpB], {
      name: "L",
      color: "green",
      fixed: true,
      visible: false,
    }); // fixed : true ドラッグ不可

    // イベントハンドラー定義
    this.pointA.on("drag", this.onDrag.bind(this, this.pointA));
    this.pointB.on("drag", this.onDrag.bind(this, this.pointB));
    this.selectElement.addEventListener("change", this.onChange.bind(this));
  }

  // セレクトボックスの値を取得
  getPattern() {
    this.selectElement = document.getElementById("patternSelect");
    this.pattern =
      this.selectElement.options[this.selectElement.selectedIndex].value;
    this.patternText =
      this.selectElement.options[this.selectElement.selectedIndex].text;
  }
  // dragPoint:ドラッグされているPointオブジェクト
  // 和、積を各座標について計算。計算結果はpointResultに格納
  // 初回実行前にpatternの設定が必要
  operationLoc(dragPoint) {
    var calcPattern = this.pattern;
    var coordsA = this.pointA.coords.usrCoords;
    var coordsB = this.pointB.coords.usrCoords;
    var pointResult = this.pointResult;

    switch (calcPattern) {
      case "sum":
        pointResult.x = coordsA[1] + coordsB[1];
        pointResult.y = coordsA[2] + coordsB[2];
        break;
      case "mul":
        pointResult.x = coordsA[1] * coordsB[1];
        pointResult.y = coordsA[1] * coordsB[2] + coordsA[2] * coordsB[1];
        break;
      case "inv":
        if (dragPoint) {
          let dragCoords;
          switch (dragPoint.name) {
            case "z_1":
              dragCoords = coordsA;
              break;
            case "z_2":
              dragCoords = coordsB;
              break;
            default:
            // code block
          }
          pointResult.x = 1 / dragCoords[1];
          pointResult.y = -dragCoords[2] / (dragCoords[1] * dragCoords[1]);
        }
        break;
      case "div":
        if (coordsB[1] !== 0) {
          pointResult.x = coordsA[1] / coordsB[1];
          pointResult.y =
            -(coordsA[1] * coordsB[2] - coordsB[1] * coordsA[2]) /
            (coordsB[1] * coordsB[1]);
        }
        break;
      case "div_i":
        pointResult.x = coordsA[2] / coordsB[2];
        break;
      // 追加のケース
      default:
      // code block
    }
  }
  ///
  /// イベントハンドラー群
  ///
  // リストボックス変更時
  onChange() {
    var board = this.board;
    this.getPattern();

    var pattern = this.pattern;
    var pointA = this.pointA;
    var pointB = this.pointB;
    var coordsA = pointA.coords;
    var coordsB = pointB.coords;

    switch (pattern) {
      case "div_i":
        // 実軸の値を0に設定
        pointA.setPosition(JXG.COORDS_BY_USER, [0, coordsA.usrCoords[2]]);
        pointB.setPosition(JXG.COORDS_BY_USER, [0, coordsB.usrCoords[2]]);
        // 既存のハンドラーを削除
        pointA.off("drag");
        pointB.off("drag");
        // ハンドラーを制約版に変更
        pointA.on("drag", this.onDragConstrain.bind(this, pointA));
        pointB.on("drag", this.onDragConstrain.bind(this, pointB));
        // 線を表示
        this.line.setAttribute({ visible: true });
        this.onDragConstrain(pointA); // dvi_i 選択後の初回更新
        break;
      default:
        // 既存のハンドラーを削除
        pointA.off("drag");
        pointB.off("drag");
        // ハンドラーを通常版に変更
        pointA.on("drag", this.onDrag.bind(this, pointA));
        pointB.on("drag", this.onDrag.bind(this, pointB));
        //線を非表示
        this.line.setAttribute({ visible: false });
    }
    board.update();
  }
  // その他： グラフ更新
  onDrag(dragPoint) {
    var board = this.board; // ボードを取得
    var point = this.point;
    this.operationLoc(dragPoint); //結果の座標を計算
    point.name = this.patternText; //結果のpointの名前を変更
    point.setPosition(JXG.COORDS_BY_USER, [
      this.pointResult.x,
      this.pointResult.y,
    ]); //座標更新
    board.update();
  }
  //  dvi_i :実軸の移動に対して制約
  onDragConstrain(dragPoint) {
    var board = this.board; // ボードを取得
    var point = this.point;
    var pointResult = this.pointResult;
    var coords = dragPoint.coords.usrCoords;
    var patternText = this.patternText;
    // ドラッグされたpointの実軸移動に制約を付与
    dragPoint.setPosition(JXG.COORDS_BY_USER, [0, coords[2]]);
    // 結果の座標を計算
    this.operationLoc(dragPoint);
    point.name = patternText; //結果のpointの名前を変更
    point.setPosition(JXG.COORDS_BY_USER, [pointResult.x, 0]); //座標更新
    // lpAとlpBの位置変更により直線を移動
    this.lpA.setPosition(JXG.COORDS_BY_USER, [this.point.X(), 1]); //座標更新
    this.lpB.setPosition(JXG.COORDS_BY_USER, [this.point.X(), -1]); //座標更新
    board.update();
  }
}

// figureCaptionに順番に番号を振る。<fig-rf class="figX">要素でclassがfigXのfigureの図番号を表示(表示形式："図 #")
// 注意点：はてなブログでは<fig-rf id="figX">要素を使用するときは、この要素を<div>で囲むこと。
// 以下に利用例例を示す。
// ===========================================
//<div>
// ここで<fig-rf class="figOperation"></fig-rf>を参照・・・
//
// <figure id="figOperation">
//    <div id="Operation" style="width: 400px; height: 400px;"></div>
//    <figcaption> [図の表題]</figcaption>
//  </figure>
//
// </div>
  // 図に番号を振るスクリプト
  // figureタグをすべて調べて1から番号を振る
//  document.addEventListener("DOMContentLoaded", function () {
//     var figures = document.querySelectorAll("figure");
//     figures.forEach(function (figure, index) {
//       var figcaption = figure.querySelector("figcaption");
//       figcaption.innerHTML = "図 " + (index + 1) + ": " + figcaption.innerHTML;
//       figure.dataset.figureNumber = index + 1; // 図の番号をデータ属性に保存。
//     });
//   });
//   // 参照番号を付与:シャドウDOMを使用しないバージョン
//   // 参照番号は図に番号を振るスクリプトで各図に設定されたfigureNumberを読み取り表示
// //  window.addEventListener("load", function () {
//  document.addEventListener("DOMContentLoaded", function () {
//     const figrefs = document.querySelectorAll("fig-rf"); //fig-ref要素を全て取得

//     figrefs.forEach((figrf) => {
//       var fig = this.document.getElementById(figrf.className);
//       if (fig != null) {
//         // classで指定する図のidが存在する場合
//         var figN = fig.dataset.figureNumber;
//         figrf.innerHTML = "図 " + figN;
//       }
//     });
//  });
