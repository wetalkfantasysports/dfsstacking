class Player {
    constructor(row) {
        this.position = row[0];
        this.name = row[1];
        this.team = row[2];
        this.opponent = row[3];
        this.salary = Number(row[4]);
        this.projection = Number(row[5]);
    }
}

let isTableRendered = false;
let globalData = new Array();
let globalHeaders = [];
var playerMap = new Map(); // position => (team => [players])

var oppPositions = ['RB', 'WR', 'TE'];

jQuery(document).ready(function () {
    // load default
    loadData('DraftKings');

    jQuery("#dfsSite").change(function () {
        var source = jQuery(this).val();
        loadData(source);
    });
});

function reset() {
    globalData = new Array();
    playerMap = new Map();
}

function loadData(source) {
    reset();
    var url = source === 'DraftKings' ? "https://raw.githubusercontent.com/wetalkfantasysports/dfsstacking/main/Data/DK/NFLDK.csv" : "https://raw.githubusercontent.com/wetalkfantasysports/dfsstacking/main/Data/FD/NFLFD.csv"
    var data;
    jQuery.ajax({
        type: "GET",
        url,
        dataType: "text",
        success: function (response) {
            allData = jQuery.csv.toArrays(response);
            let data = [];
            jQuery.each(allData, function (index, row) {
                if (index > 0) {
                    var player = new Player(row);
                    // player array
                    data.push(player);
                    // player dict
                    if (!playerMap.has(player.position)) {
                        playerMap.set(player.position, new Map());
                    }
                    if (!playerMap.get(player.position).has(player.team)) {
                        playerMap.get(player.position).set(player.team, new Array());
                    }
                    playerMap.get(player.position).get(player.team).push(player);
                }
            });
            globalData = data;
            buildStack('QB', 'WR', 'WR');
        }
    });
}

function buildStack(positionOne, positionTwo, positionThree, positionFour) {
    let rows = [];
    var player_teams_map = this.playerMap.get(positionOne);
    for (const [team_key, player_list] of player_teams_map.entries()) {
        var player_cache=[];
        player_list.forEach(playerOne => {
            var player_two_list = this.playerMap.get(positionTwo).get(team_key);
            if (player_two_list) {
                for (let i = 0; i < player_two_list.length; i++) {
                    let playerTwo = player_two_list[i];
                    if (!positionThree) {
                        var sortedString = [playerOne.name, playerTwo.name].sort().join('');
                        if (player_cache.includes(sortedString)) {
                            continue;
                        }
                        player_cache.push(sortedString);
                        if (playerOne.name === playerTwo.name) {
                            continue;
                        }
                        let projections = Math.round((playerOne.projection + playerTwo.projection) * 100 / 100);
                        let salaries = Math.round((playerOne.salary + playerTwo.salary) * 100 / 100);
                        rows.push([
                            team_key,
                            playerOne.opponent,
                            playerOne.name,
                            playerTwo.name,
                            projections,
                            `${(salaries / 1000).toFixed(1)}k`,
                            (Math.round(((projections / salaries) * 1000) * 100) / 100).toFixed(2)
                        ]);
                    } else if (positionThree === 'Opp') {
                        var opponent = playerOne.opponent.indexOf('@') > -1 ? playerOne.opponent.substring(1) : playerOne.opponent;
                        var t = playerTwo.position === 'RB' ? ['WR', 'TE'] : oppPositions;
                        t.forEach(oppPos => {
                            var player_list = this.playerMap.get(oppPos).get(opponent);
                            if (player_list) {
                                for (let o = 0; o < player_list.length; o++) {
                                    let opp = player_list[o];
                                    let projections = Math.round((playerOne.projection + playerTwo.projection + opp.projection) * 100 / 100);
                                    let salaries = Math.round((playerOne.salary + playerTwo.salary + opp.salary) * 100 / 100);
                                    rows.push([
                                        team_key,
                                        playerOne.opponent,
                                        playerOne.name,
                                        playerTwo.name,
                                        opp.name,
                                        projections,
                                        `${(salaries / 1000).toFixed(1)}k`,
                                        (Math.round(((projections / salaries) * 1000) * 100) / 100).toFixed(2)
                                    ]);
                                }
                            }
                        });
                    } else {
                        positionThree.split('/').forEach(pos => {
                            var player_three_list = this.playerMap.get(pos).get(team_key);
                            if (player_three_list) {
                                var startIndex = positionTwo === pos ? i + 1 : 0;
                                for (let j = startIndex; j < player_three_list.length; j++) {
                                    let playerThree = player_three_list[j];

                                    if (!positionFour) {
                                        let projections = Math.round((playerOne.projection + playerTwo.projection + playerThree.projection) * 100 / 100);
                                        let salaries = Math.round((playerOne.salary + playerTwo.salary + playerThree.salary) * 100 / 100);
                                        rows.push([
                                            team_key,
                                            playerOne.opponent,
                                            playerOne.name,
                                            playerTwo.name,
                                            playerThree.name,
                                            projections,
                                            `${(salaries / 1000).toFixed(1)}k`,
                                            (Math.round(((projections / salaries) * 1000) * 100) / 100).toFixed(2)
                                        ]);
                                    } else {
                                        var opponent = playerOne.opponent.indexOf('@') > -1 ? playerOne.opponent.substring(1) : playerOne.opponent;
                                        var t = positionFour.indexOf('WR') > -1 ? ['WR'] : positionFour.indexOf('RB/TE') > -1 ? ['RB', 'TE'] : oppPositions;
                                        t.forEach(oppPos => {
                                            var player_list = this.playerMap.get(oppPos).get(opponent);
                                            if (player_list) {
                                                for (let o = 0; o < player_list.length; o++) {
                                                    let opp = player_list[o];
                                                    let projections = Math.round((playerOne.projection + playerTwo.projection + playerThree.projection + opp.projection) * 100 / 100);
                                                    let salaries = Math.round((playerOne.salary + playerTwo.salary + playerThree.salary + opp.salary) * 100 / 100);
                                                    rows.push([
                                                        team_key,
                                                        playerOne.opponent,
                                                        playerOne.name,
                                                        playerTwo.name,
                                                        playerThree.name,
                                                        opp.name,
                                                        projections,
                                                        `${(salaries / 1000).toFixed(1)}k`,
                                                        (Math.round(((projections / salaries) * 1000) * 100) / 100).toFixed(2)
                                                    ]);
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        })
                    }
                }
            }
        });
    }

    renderTable(rows, positionOne, positionTwo, positionThree, positionFour);
}

function renderTable(rows, positionOne, positionTwo, positionThree, positionFour) {
    if (isTableRendered) {
        jQuery('#myTableNFLDFS').DataTable().clear().destroy();
        jQuery('#myTableNFLDFS').empty();
    }

    columns = [
        { 'sTitle': 'Team' },
        { 'sTitle': 'Opp' },
        { 'sTitle': `${positionOne}` },
        { 'sTitle': `${positionTwo}` },
    ]

    if (positionThree) {
        columns.push({ 'sTitle': `${positionThree}` })
    }

    if (positionFour) {
        columns.push({ 'sTitle': `${positionFour}` })
    }

    columns = columns.concat(
        [
            { 'sTitle': 'Proj' },
            { 'sTitle': '$' },
            { 'sTitle': 'Value' }
        ]
    )

    var valueIndex = columns.findIndex(x => x.sTitle === 'Proj');

    jQuery('#myTableNFLDFS').DataTable({
        "pageLength": 25,
        "rowDefs": [{ className: 'dt-body-center' }],
        "aaData": rows,
        "aoColumns": columns,
        "initComplete": function (settings, json) {  
         jQuery("#myTableNFLDFS").css({"overflow-x":"auto", "white-space": "nowrap", "width":"100%", "position":"relative", "color":"black", "font-size":"1.15em"});                       
          },
        "order": [[valueIndex, "desc"]]
    });
    isTableRendered = true;
}