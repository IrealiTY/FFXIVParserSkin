var datasetosu = [];
	var settingosu = {};
settingosu.topOffset = 40;			// For positioning purposes should be like this
settingosu.boxHeight = 43; 		// This gives that little overlap to match the original
	
	
	//==============================================
	// STUFF THAT CAN BE CONFIGURED BY THE USER GOES HERE
	
settingosu.flashEnabled = true;	// Set to false to disable flash
settingosu.maxDisplay = 8;			// Number of rows to display
settingosu.transitionTime = 5;		// Rank animation time, lower = shorter
settingosu.fps = 60;				// Drawing fps
	
settingosu.nameInitials = "last"; 	// Set name abbreviation rule: "default", "first", "last" or "initials"
	
	//==============================================
	
	var flashFlag = false;
	var flashPos;
	var maxHit = 0;
		//
		// プラグイン側から以下のような ActXiv オブジェクトとしてデータが提供される
		//
		// var ActXiv = {
		//	"Encounter": {...},
		//	"Combatant": {
		//		"PlayerName1": {...},
		//		"PlayerName2": {...},
		//		...
		//	}
		// };
		//
		// データの更新は 1 秒毎。
		//
		// プラグインから onOverlayDataUpdate イベントが発行されるので、それを受信することもできる
		// イベントハンドラの第一引数の detail プロパティ内に上記のオブジェクトが入る
		//
		//
		// 表示設定 (2)
		//
		//
		// 以下表示用スクリプト
		//
		// onOverlayDataUpdate イベントを購読
		document.addEventListener("onOverlayDataUpdate", function (e) {
			update(e.detail);
		});
		var rankingosu = new Array(); // TODO give this var a better name
		var prevRank;
		
		// 表示要素の更新
		function update(data) {
			var encDiv = document.getElementById("encounter");
			
			// DRAWS TITLE
			encDiv.innerHTML = "<table cellspacing=0 cellpadding=0><tr><td colspan=2><div id = 'title'>" + parseActFormat("{title}" , data.Encounter) + "</div></td></tr>" + 
							    "<tr><td align='left'>" + parseActFormat("{duration}" , data.Encounter) + "</td>" + 
								"<td align='right'>" + parseFloat(parseActFormat("{dps}" , data.Encounter)).toFixed(1) + "</td></tr>"
								+ "</table>";
			
			// RANKING, THIS VAR STORES DATA TO BE DISPLAYED
			rankingosu = new Array(Object.keys(data.Combatant).length);
			var i = 0;
			maxHit = 0;
			for(var combName in data.Combatant) {
				if(!data.Combatant.hasOwnProperty(combName)) continue;
				
				rankingosu[i] = {};
				rankingosu[i].name = data.Combatant[combName]["name"];
				rankingosu[i].dps  = parseFloat(data.Combatant[combName]["encdps"].replace(/[\.,]+/g), ".").toFixed(1);
				rankingosu[i].hps  = parseFloat(data.Combatant[combName]["enchps"].replace(/[\.,]+/g) ,".").toFixed(1);
				rankingosu[i].dmg  = parseInt(data.Combatant[combName]["damage"]);
				rankingosu[i].dmgp = data.Combatant[combName]["damage%"];
				rankingosu[i].critp = data.Combatant[combName]["crithit%"];
				rankingosu[i].max  = parseInt(data.Combatant[combName]["MAXHIT"].replace(/[\.,]+/g ,""));
				rankingosu[i].maxname  = data.Combatant[combName]["maxhit"].replace(/[0-9\.,-]+/g ,"");
				rankingosu[i].misses  = data.Combatant[combName]["misses"];
				
				// this is just to grab the correct glow icon
				rankingosu[i].job = data.Combatant[combName]["Job"].toLowerCase();
				if(rankingosu[i].job == undefined || rankingosu[i].job  == "") {
					rankingosu[i].job = rankingosu[i].name;
					if(rankingosu[i].job.indexOf("-Egi (") != -1) {
						rankingosu[i].job = rankingosu[i].job.substring(0, rankingosu[i].job.indexOf("-Egi ("));
					} else if (rankingosu[i].job.indexOf("Eos (") == 0) {
                    	rankingosu[i].job = "Eos";
                	} else if (rankingosu[i].job.indexOf("Selene (") == 0) {
                    	rankingosu[i].job = "Selene";
                	} else if (rankingosu[i].job.indexOf("Carbuncle (") != -1) {
						rankingosu[i].job = "Carbuncle"; 
                	} else if (rankingosu[i].job.indexOf(" (") != -1) {
						rankingosu[i].job = "choco";
					} else if (rankingosu[i].job.indexOf("Limit Break") != -1) {
						rankingosu[i].job = "Limit Break";
					} else {
						rankingosu[i].job = "error";
					} 
				}
				
				// dps may be infinite at zero duration so this makes at least display something later
				if(isNaN(rankingosu[i].dps)) {
					rankingosu[i].dps = rankingosu[i].dmg;
				}
				
				// saves the max hit here because i'm too lazy to parse from the encounter JSON
				if(rankingosu[i].max > maxHit) maxHit = rankingosu[i].max;
				
				i++;
			}
			
			// remove stuff dealing 0 damage
			
			var clean = new Array();
			for(i = 0; i < rankingosu.length; i++) {
				if(rankingosu[i].dmg > 0) {
					clean.push(rankingosu[i]);
				}
			}
			rankingosu = clean;
			
			// SORT AND UPDATE RANKINGS
			rankingosu.sort(function(a, b){return b.dmg - a.dmg});
			
			if(prevRank === undefined) {
				prevRank = new Array();
			}
			
			// GET PREVIOUS RANKING
			for (i = 0; i < rankingosu.length; i++) {
				rankingosu[i].prev = -1; // this is "no previous rank"
				
				// if has previous rank, calculate initial position
				for (var j = 0; j < prevRank.length; j++) {
					if (prevRank[j].name === rankingosu[i].name) {
						rankingosu[i].prev = j;
						continue;
					}
				}
				
				if(rankingosu[i].name == "YOU") {
					rankingosu[i].alpha = (rankingosu[i].prev == -1)?0:1;
				}
				if (rankingosu[i].prev == -1 || rankingosu[i].prev > settingosu.maxDisplay) { 		// for people joining the ranks (fade in)
					rankingosu[i].y = settingosu.topOffset + settingosu.boxHeight * (i + 1);					
					rankingosu[i].prev = i;
				} else {
					rankingosu[i].y = settingosu.topOffset + settingosu.boxHeight * rankingosu[i].prev;	// for everyone else (fade out if leaving)
					rankingosu[i].alpha = 1;
				}
				
				
				// If get better deeps, then flashy effect (only when getting to top ranks tho)
				if (rankingosu[i].name == "YOU" && i < rankingosu[i].prev && rankingosu[i].prev < settingosu.maxDisplay) {
					flashFlag = true;
					flashPos = Math.min(settingosu.maxDisplay - 1, rankingosu[i].prev);
					t = 0;
				}
			}
			
			//console.log(data);
			//console.log(rankingosu);
			
			// UPDATE DATA;
			prevRank = rankingosu;
			//datasetosu.push(data); // for debug etc
			
		}
		var t = 0;
		
		
		// Draws stuff by clearing everything every time, so it may be slow as shit on lower end pcs
		function draw() {
		
			var combDiv = document.getElementById("combatant");
			
			// Clears everything before drawing
			while(combDiv.firstChild) {
				combDiv.removeChild(combDiv.firstChild);
			}
			var myRank = -1;
			for(i = 0; i < rankingosu.length; i++) {
				if(rankingosu[i].name == "YOU") {
					myRank = i;
				}
			}
			
			// if is scrub and does not even get in the top ranks
			var isLast = (myRank >= settingosu.maxDisplay - 1);
			
			// the actual drawing part
			for(i = 0; i < rankingosu.length; i++) {
			
				var box = document.createElement("div");
				box.className = "combBox";
				
				if (i == settingosu.maxDisplay - 1 && myRank != -1 && isLast) {	// show at last on the list even if not on top ranks
					i = myRank;
					rankingosu[i].y = settingosu.topOffset + settingosu.boxHeight * (settingosu.maxDisplay - 1);
					rankingosu[i].alpha +=  (1 - rankingosu[i].alpha) / settingosu.transitionTime;
				
				} else if(i >= settingosu.maxDisplay) {
					if (rankingosu[i].prev < settingosu.maxDisplay)  { // fade out
						rankingosu[i].y += ((settingosu.topOffset + settingosu.boxHeight * settingosu.maxDisplay) - rankingosu[i].y ) / settingosu.transitionTime;
						rankingosu[i].alpha += (0 - rankingosu[i].alpha) / settingosu.transitionTime;
					} else {
						rankingosu[i].alpha = 0;
					}
				} else {
					rankingosu[i].y += ((settingosu.topOffset + settingosu.boxHeight * i) - rankingosu[i].y ) / settingosu.transitionTime;
					if (rankingosu[i].prev < settingosu.maxDisplay)  {
						rankingosu[i].alpha = 1;
					} else {
						rankingosu[i].alpha += (1 - rankingosu[i].alpha) / settingosu.transitionTime;
					}
					
				}
								
				box.innerHTML = " <img src='images/glow/" + rankingosu[i].job + ".png' >";
				box.innerHTML += "<div class='playerName" + ((i == myRank)?" me":"") + "'>" + processName(rankingosu[i].name) + "</div><br>";
				
				// writing the deeps or damage
				if (rankingosu[i].dps > 0) {
					box.innerHTML += "<div class='dmg'>" + rankingosu[i].dps.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "<div class='percent'>" + rankingosu[i].dmgp + "</div></div><br>";
				} else {
					if(rankingosu[i].dmg > 0) {
						box.innerHTML += "<div class='dmg' style='font-style:italic'>" + rankingosu[i].dmg + "</div><br>";
					} else {
						box.innerHTML += "<div class='dmg'>&nbsp;</div><br>"
					}
				}
				
				// writing crit %
				if (rankingosu[i].critp != "0%") {
					box.innerHTML += "<div class='crit'>" + rankingosu[i].critp + "</div>";
				}
				// writing crit %
				if (rankingosu[i].misses != "0") {
					box.innerHTML += "<div class='miss'>" + rankingosu[i].misses + "</div>";
				}
				
				// fancy printing of max hit
				if (rankingosu[i].max > 0) {
					if (rankingosu[i].max == maxHit) {
						box.innerHTML += "<div class='max' style='color:yellow'>" + rankingosu[i].max + "</div><br>";
					} else {
						box.innerHTML += "<div class='max'>" + rankingosu[i].max + "</div><br>";
					}
				} else {
						box.innerHTML += "<div class='max'>&nbsp;</div><br>";
				}
				
				
				// COLOR SETTING
				var tank   = ["gld", "gla", "pld", "mrd", "war", "drk"];
				var dps    = ["pgl", "mnk", "lnc", "drg", "arc", "brd", "rog", "nin", "acn", "smn", "thm", "blm", "mch", "sam", "rdm"];
				var healer = ["cnj", "whm", "sch", "ast"];
				
				var maxOpacity = (i == myRank)?0.4:0.3;
				var minOpacity = (i == myRank)?0.1:0.0;
				var themeColor = "200,0,200";		
				
				if (healer.indexOf(rankingosu[i].job) != -1) {
					themeColor = "107,240,86";
				} else if (dps.indexOf(rankingosu[i].job) != -1)  {
					themeColor = "200,3,8";
				} else if (tank.indexOf(rankingosu[i].job) != -1) {
					themeColor = "41,112,243";
				} else if (rankingosu[i].job.indexOf("Limit Break") != -1){ 
					themeColor = "243,102,8";
				} 
				
				box.style.background = "linear-gradient(rgba(" + themeColor + "," + maxOpacity + 
										((i == myRank)?"),rgba(" + themeColor + ",":"),rgba(0,0,0,") + minOpacity + "))";
				box.style.border = "1px solid rgba(" + themeColor + ", " + maxOpacity + ")"; 
				
				box.style.top = rankingosu[i].y;
				box.style.opacity = rankingosu[i].alpha;
				
				
				var rank = document.createElement("div");
				rank.className = "rank";
				rank.innerHTML = (i + 1);
				box.appendChild(rank);
				combDiv.appendChild(box);
				
			}
			
			// draws flashy effect
			if(settingosu.flashEnabled && flashFlag && !isLast) {
				flash1 = document.getElementById("flash1");
				flash2 = document.getElementById("flash2");
				
				flash1.style.top = settingosu.topOffset + settingosu.boxHeight * flashPos-50;
				flash2.style.top = settingosu.topOffset + settingosu.boxHeight * flashPos-50;
				flash1.style.left = -20;
				
				
				if(t < 15) { 
					flash1.style.opacity = t / 15;
					
					flash2.style.opacity = t / 15;
					flash2.style.width = 80 * t;
					flash2.style.left = 70*t - flash2.style.width/2;
				} else { 
					flash1.style.opacity = 1 - (t - 15) / 35;
					flash2.style.opacity = 1 - (t - 15) / 35;
				}
				
				t++;
				if(t >= 50){
					flash1.style.opacity = 0;
					flash2.style.opacity = 0;
					t = 0;
					flashFlag = false;
					flashPos = 999;
				}
			}
			
		}
		
		
		// Miniparse フォーマット文字列を解析し、表示文字列を取得する
		function parseActFormat(str, dictionary) {
			var result = "";
			var currentIndex = 0;
			do {
				var openBraceIndex = str.indexOf('{', currentIndex);
				if (openBraceIndex < 0) {
					result += str.slice(currentIndex);
					break;
				}
				else {
					result += str.slice(currentIndex, openBraceIndex);
					var closeBraceIndex = str.indexOf('}', openBraceIndex);
					if (closeBraceIndex < 0) {
						// parse error!
						console.log("parseActFormat: Parse error: missing close-brace for " + openBraceIndex.toString() + ".");
						return "ERROR";
					} else {
						var tag = str.slice(openBraceIndex + 1, closeBraceIndex);
						if (typeof dictionary[tag] !== 'undefined') {
							result += dictionary[tag];
						} else {
							console.log("parseActFormat: Unknown tag: " + tag);
							result += "ERROR";
						}
						currentIndex = closeBraceIndex + 1;
					}
				}
			} while (currentIndex < str.length);
			return result;
		}
		
		
		// Transforms a name into initials
		function processName(name) {
			if(name == "YOU") return name;
			if(settingosu.nameInitials == "first"){
				return name.replace(/([a-z']+)(?=[ ()]*)/, ".");
			} else if (settingosu.nameInitials == "last") {
				return name.replace(/([a-z']+)(?=[ ()]*$)/, ".");
			} else if (settingosu.nameInitials == "initials") {
				return name.replace(/([a-z']+)/g, ".");
			} else {
				return name;
			}
		}
		
		
		function updateTest() {
			update(datasetosu[0]);
			datasetosu.push(datasetosu.shift());
		}
		
		drawTimer = setInterval("draw()", 1000/settingosu.fps);
	    //updateTimer = setInterval("updateTest()", 1000);