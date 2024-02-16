// ==UserScript==
// @name         PT魔力计算器
// @namespace    https://github.com/jinhill/pt-bonus-calc
// @version      2.1.0
// @description  NexusPHP架构的PT站种子魔力值和当前做种魔力值计算器
// @author       Jinhill
// @require      https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js
// @match        *://*/mybonus.php*
// @match        *://*/torrents.php*
// @match        *://*/userdetails.php*
// @license      GPL License
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

var $ = jQuery;
var OFFICIAL_SUFFIX_REGEX = /^(.*?)(HDSky|HDS|HDSTV|HDSWEB|HDSPad)$/;
var OFFICIAL_TAG_REGEX = /官组|官方/;
var iT, iS, iN, iK;
var T0, N0, B0, L, M;
var TOR_DATA = [];
var tor_ids = [];
var tor_ids_cnt = 0;
var host;

function getFileName() {
	var loc = window.location.toString();
	var regex = /\/([^\/?#]+)(?:[?#]|$)/;
	var match = loc.match(regex);
	if (match) {
		return match[1];
	}
	return "";
}

function getPageId() {
	var fileName = getFileName();
	var pageId = 0;
	if (fileName == "mybonus.php") {
		pageId = 1;
	} else if (fileName == "torrents.php") {
		pageId = 2;
	} else if (fileName == "userdetails.php") {
		pageId = 3;
	}
	return pageId;
}

function getPubTime(row, idx, torId) {
	setTimeout(() => {
		$.ajax({
			url: "details.php?id=" + torId + "&hit=1",
			success: function(result) {
				var markTag = $(result).find('#bookmark0');
				if (markTag.length > 0) {
					var torTime = markTag.next().next().attr("title");
					var tObj = TOR_DATA.find((item) => item.id == torId);
					if (tObj) {
						tObj.time = torTime;
					}
					getBonusByIdx(row);
				}
			}
		});
	}, idx * 1500);
}

function getQueryByName(url, name) {
	var result = url.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
	if (result == null || result.length < 1) {
		return "";
	}
	return result[1];
}

function calcA(t, s, n, k) {
	var c1 = 1 - Math.pow(10, -(t / T0));
	n = n ? n : 1;
	var c2 = 1 + Math.pow(2, .5) * Math.pow(10, -(n - 1) / (N0 - 1));
	var ck = k ? k : 1;
	// HDSky A = A * K * M / (N+1)
	if (M) {
		c2 = c2 * ck * M / (n + 1);
	}
	return Number((c1 * s * c2).toFixed(2));
}

function calcB(a) {
	return Number((B0 * (2 / Math.PI) * Math.atan(a / L)).toFixed(2));
}

function makeChart() {
	var a = parseFloat($("div:contains(' (A = ')")[0].innerText.split(" = ")[1]);
	$("table+h1").before('<div id="main" style="width: 600px;height:400px; margin:auto;"></div>');
	var data = [];
	for (var i = 0; i < 25 * L; i = i + L / 4) {
		data.push([i, calcB(i)])
	}

	var myChart = echarts.init(document.getElementById('main'));
	var option = {
		title: {
			text: 'B - A 图',
			top: 'bottom',
			left: 'center'
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross'
			},
			backgroundColor: 'rgba(255, 255, 255, 0.8)',
			position: function(pos, params, el, elRect, size) {
				var obj = {
					top: 10
				};
				obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
				return obj;
			},
			extraCssText: 'width: 170px'
		},
		xAxis: {
			name: 'A',
		},
		yAxis: {
			name: 'B'
		},
		axisPointer: {
			label: {
				backgroundColor: '#777'
			}
		},
		series: [{
				type: 'line',
				data: data,
				symbol: 'none'
			},
			{
				type: 'line',
				data: [
					[a, calcB(a)]
				],
				symbolSize: 6
			}
		]
	};

	myChart.setOption(option);
}

function makeA($this, pageId, row, iT, iS, iN, iK) {
	var tor;
	var tor_title = $this.children('td:eq(' + iK + ')').find("a").attr("title");
	var official_suffix = OFFICIAL_SUFFIX_REGEX.test(tor_title);
	var time = $this.children('td:eq(' + iT + ')').find("span").attr("title");
	var size = $this.children('td:eq(' + iS + ')').text().trim();
	var size_tp = 1;
	var s = size.replace(/[KMGT]B/, function(tp) {
		if (tp == "KB") {
			size_tp = 1 / 1024 / 1024;
		} else if (tp == "MB") {
			size_tp = 1 / 1024;
		} else if (tp == "GB") {
			size_tp = 1;
		} else if (tp == "TB") {
			size_tp = 1024;
		}
		return "";
	});
	s = parseFloat(s) * size_tp;
	s = Number(s.toFixed(2));
	if (pageId == 3) { //userdetails
		var tor_href = $this.children('td:eq(' + iK + ')').find("a").attr("href");
		var tobj = {
			id: getQueryByName(tor_href, "id"),
			size: s,
			time: '0',
			a: 0
		}
		tor_ids.push(tobj.id);
		if (tor_ids.length == tor_ids_cnt) {
			//clean up deleted seeds.
			TOR_DATA = TOR_DATA.filter((item) => tor_ids.includes(item.id));
			getTotalBonus();
		}
		tor = TOR_DATA.find((item) => item.id == tobj.id);
		if (tor) {
			time = tor.time;
		} else {
			TOR_DATA.push(tobj);
		}
		if ((!tor) || (!time) || (time == '0')) {
			getPubTime(row, tor_ids.length - 1, tobj.id);
			return "loading...";
		}
	}
	var official_tag = $this.children('td:eq(' + iK + ')').find("span").filter(function() {
		return OFFICIAL_TAG_REGEX.test($(this).text().trim());
	});
	var k = official_tag.length || official_suffix ? 2 : 1;
	var t = (new Date().getTime() - new Date(time).getTime()) / 1e3 / 86400 / 7;
	var num = $this.children('td:eq(' + iN + ')').text().trim();
	var n = parseInt(num.replace(/,/g, ''));
	var a = calcA(t, s, n, k);
	var b = calcB(a);
	var ave = (a / s).toFixed(2);
	if (tor) {
		tor.a = a;
	}
	if ((a > s * 2) && (n != 0)) {
		//Red A is greater than twice the size.
		return '<span style="color:#ff0000;font-weight:900;">' + b + '|' + a + '|' + ave + '</span>';
	} else {
		return b + '|' + a + '|' + ave;
	}
}

function getTotalBonus() {
	GM_setValue(host + ".TOR_DATA", TOR_DATA);
	var sumS = TOR_DATA.reduce((acc, item) => acc + (item.size ? item.size : 0), 0);
	var sumA = TOR_DATA.reduce((acc, item) => acc + (item.a ? item.a : 0), 0);
	//convert size GB to TB
	sumS = sumS / 1024;
	var b = calcB(sumA);
	var tbSpan = $("#total-bonus");
	var tbText = "共" + TOR_DATA.length + "个种子，A:" + sumA.toFixed(2) + "，时魔B:" + b + "，总大小:" + sumS.toFixed(2) + "TB";
	if (tbSpan.length > 0) {
		tbSpan.text(tbText)
	} else {
		$("#ka1").before("<span id='total-bonus'>" + tbText + "</span>");
	}
}

function getBonusByIdx(idx) {
	var $this = $("#ka1>table>tbody>tr").eq(idx);
	var textA = makeA($this, 3, idx, iT, iS, iN, iK);
	$this.find("td:nth-last-child(2)").html(textA);
	getTotalBonus();
}

function getBonus(pageId) {
	if (!T0 || !N0 || !B0 || !L) {
		var con = confirm("需要先获取魔力计算常量，自动跳转到魔力计算页面?");
		if (con) {
			location.href = "mybonus.php";
		} else {
			alert("没有获取魔力计算常量无法计算值！请点击'魔力值 [使用]'");
		}
	}
	var sel = ".torrents:last-of-type>tbody>tr";
	var tdCss = "";
	if (pageId == 3) { //userdetails
		sel = "#ka1>table>tbody>tr";
		tdCss = "align=\"center\"";
	}
	//clear all tor ids and reload tor ids
	tor_ids.splice(0, tor_ids.length);
	tor_ids_cnt = $(sel).length - 1;
	$(sel).each(function(row) {
		var $this = $(this);
		if (row == 0) {
			$this.children('td').each(function(col) {
				if ("标题" == $(this).text().trim()) {
					iK = col;
				} else if ($(this).find('img.time').length) {
					iT = col;
				} else if ($(this).find('img.size').length) {
					iS = col;
				} else if ($(this).find('img.seeders').length) {
					iN = col;
				}
			})
			$this.children("td:last").before("<td class=\"colhead\" " + tdCss +
				" title=\"B值|A值|每GB的A值\">B|A|A/GB</td>");
		} else {
			var textA = makeA($this, pageId, row, iT, iS, iN, iK);
			$this.children("td:last").before("<td class=\"rowfollow\" " + tdCss + ">" + textA + "</td>");
		}
	})
	console.log(TOR_DATA);
}

function hookDivEvent() {
	var observer = new MutationObserver(fnHandler),
		elTarget = document.querySelector("#ka1"),
		objConfig = {
			childList: true,
			subtree: false,
			attributes: false,
			characterData: false
		};
	observer.observe(elTarget, objConfig);

	function fnHandler() {
		getBonus(3);
	}
};

//Load data from storage into global variables
function loadParam(host) {
	T0 = GM_getValue(host + ".T0");
	N0 = GM_getValue(host + ".N0");
	B0 = GM_getValue(host + ".B0");
	L = GM_getValue(host + ".L");
	M = GM_getValue(host + ".M");
	TOR_DATA = GM_getValue(host + ".TOR_DATA");
	if (!TOR_DATA) {
		TOR_DATA = [];
	}
}

function saveParam(host) {
	T0 = parseInt($("li:has(b:contains('T0'))")[1].innerText.split(" = ")[1]);
	N0 = parseInt($("li:has(b:contains('N0'))")[1].innerText.split(" = ")[1]);
	B0 = parseInt($("li:has(b:contains('B0'))")[1].innerText.split(" = ")[1]);
	L = parseInt($("li:has(b:contains('L'))")[1].innerText.split(" = ")[1]);
	if (host === 'hdsky.me') {
		M = parseInt($("li:has(b:contains('M'))")[1].innerText.split("=")[1]);
		GM_setValue(host + ".M", M);
	}
	GM_setValue(host + ".T0", T0);
	GM_setValue(host + ".N0", N0);
	GM_setValue(host + ".B0", B0);
	GM_setValue(host + ".L", L);
	console.log("get and save params ok.");
}

function run() {
	host = window.location.host.match(/\b[^\.]+\.[^\.]+$/)[0];
	loadParam(host);
	var pageId = getPageId();
	if (pageId == 1) { //mybonus
		saveParam(host);
		makeChart();
	} else if (pageId == 2) { //torrents
		getBonus(pageId);
	} else if (pageId == 3) { //userdetails
		hookDivEvent();
	}
}

run();