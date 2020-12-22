var uiSuggest = {
    setItems: function () {

        if (myPlayer !== undefined && myPlayer.gold > 500 &&
            (!myPlayer.ownsCannon || !myPlayer.ownsFishingRod || (myPlayer.parent !== undefined &&
                myPlayer.parent.netType != 1))
        ) {
            /* if ($('#earn-gold').is(':visible'))
                $('#earn-gold').hide();

        	if (myPlayer.ownsCannon)
                $('#cannon-shop-div').hide();
        		

        	if (myPlayer.ownsFishingRod)
                $('#fishingrod-shop-div').hide();
        		
        	
        	if (myPlayer.parent !== undefined && myPlayer.parent.netType == 1)
                $('#raft-shop-div').hide();
        	

        	$('#suggestion-ui').show();*/

        }
    }
};