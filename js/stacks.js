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

    $(document).ready( function () {
        // load default
        loadData('draftKings');
    } );

    function reset() {
        globalData = new Array();
        playerMap = new Map();
    }

    function loadData(source) {
        reset();
        var url = source === 'draftKings' ? "https://raw.githubusercontent.com/wetalkfantasysports/dfsstacking/main/www/NFLDK.csv" : "https://raw.githubusercontent.com/wetalkfantasysports/dfsstacking/main/www/NFLFD.csv"
        var data;
        $.ajax({
            type: "GET",  
            url,
            dataType: "text",      
            success: function(response) {
                allData = $.csv.toArrays(response);
                let data = [];
                console.log(allData);
                $.each(allData, function( index, row ) {
                    if(index > 0) {
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
                console.log(playerMap);
                globalData = data;
                buildStack('QB', 'WR', 'WR');
            }
        });
    }

    function buildStack(positionOne, positionTwo, positionThree, positionFour) {
        let rows = [];
        console.log(globalData);
        var player_teams_map = this.playerMap.get(positionOne);
        for (const [team_key, player_list] of player_teams_map.entries()) {
            player_list.forEach(playerOne => {
                var player_two_list = this.playerMap.get(positionTwo).get(team_key);
                if (player_two_list) {
                    for (let i = 0; i < player_two_list.length; i++) {
                        let playerTwo = player_two_list[i];

                        if (!positionThree) {
                            let projections = Math.round((playerOne.projection + playerTwo.projection) * 100 / 100);
                            let salaries = Math.round((playerOne.salary + playerTwo.salary) * 100 / 100);
                            rows.push([
                                team_key,
                                playerOne.opponent,
                                playerOne.name,
                                playerTwo.name,
                                projections,
                                salaries,
                                Math.round(((projections/salaries) * 1000) * 100) / 100
                            ]);
                        } else if (positionThree === 'Opp') {
                            var opponent = playerOne.opponent.indexOf('@') > -1 ? playerOne.opponent.substring(1) : playerOne.opponent;
                            var player_list = this.playerMap.get('WR').get(opponent);
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
                                    salaries,
                                    Math.round(((projections/salaries) * 1000) * 100) / 100
                                ]);
                            }
                        } else {
                            var player_three_list = this.playerMap.get(positionThree).get(team_key);
                            var startIndex = positionTwo === positionThree ? i + 1 : 0;
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
                                        salaries,
                                        Math.round(((projections/salaries) * 1000) * 100) / 100
                                    ]);
                                } else {
                                    var opponent = playerOne.opponent.indexOf('@') > -1 ? playerOne.opponent.substring(1) : playerOne.opponent;
                                    var player_list = this.playerMap.get('WR').get(opponent);
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
                                            salaries,
                                            Math.round(((projections/salaries) * 1000) * 100) / 100
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        renderTable(rows, positionOne, positionTwo, positionThree, positionFour);
    }

    function renderTable(rows, positionOne, positionTwo, positionThree, positionFour) {
        if (isTableRendered) {
            $('#myTable').DataTable().clear().destroy();
            $('#myTable').empty();
        }

        columns = [
            {'sTitle': 'Team'},
            {'sTitle': 'Opp'},
            {'sTitle': `${positionOne}`},
            {'sTitle': `${positionTwo}`},
        ]

        if (positionThree) {
            columns.push({'sTitle': `${positionThree}`})
        }

        if (positionFour) {
            columns.push({'sTitle': `${positionFour}`})
        }

        columns = columns.concat(
            [
                {'sTitle': 'Proj'},
                {'sTitle': '$'},
                {'sTitle': 'Value'}
            ]
        )

        $('#myTable').DataTable({
            "pageLength": 50,
            "rowDefs": [{ className: 'dt-body-center'}],
            "aaData": rows,
            "aoColumns": columns
        });
        isTableRendered = true;
    }