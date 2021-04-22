
get_auth_token() {
	export AUTH_TOKEN="`node ~/git/tempora/scripts/getTestUserAuthToken.js`"
}

import_meditation() {
	export TEMP_JSON=".`date '+%s'`.json"
	## 1) get the upload url
	http https://1sctves1d1.execute-api.us-east-1.amazonaws.com/upload-url Authorization:"$AUTH_TOKEN" > "$TEMP_JSON"
	UPLOAD_URL="`cat $TEMP_JSON | jq -r '.uploadUrl'`"
	UPLOAD_KEY="`cat $TEMP_JSON | jq -r '.uploadKey'`"

	## 2) upload the mp3
	http PUT "$UPLOAD_URL" < "$mp3"


	## 3) create the meditation
	http https://1sctves1d1.execute-api.us-east-1.amazonaws.com/meditations Authorization:"$AUTH_TOKEN" uploadKey="$UPLOAD_KEY" isPublic:='true' name="$name" text="$text" uploadKey="$UPLOAD_KEY"
}

get_auth_token
echo $AUTH_TOKEN

# text="If you wish to prepare a “fragrant offering,” you should combine in equal measure diaphanous frankincense, cassia, the aroma onyx, and myrrh, just as the law requires— these are the four virtues. For when these are perfected and present in equal measure, your mind will not be betrayed to the enemy." mp3="../media/old/evagrius.onprayer.001.mp3" name="Evagrius On Prayer 001"

text="A soul purified through the fullness of the virtues makes the rule of the mind in the body and soul secure, thereby making it receptive to the state that it seeks." mp3="../media/old/evagrius.onprayer.002.mp3" name="Evagrius On Prayer 002"
# import_meditation
text="Prayer is the mind’s conversation with God. If the mind is going to be able to direct itself without distraction towards its Lord and converse with him directly, what state it must receive!" mp3="../media/old/evagrius.onprayer.003.mp3" name="Evagrius On Prayer 003"
# import_meditation
text="If in trying to approach an earthly burning bush Moses is prevented from coming close until he “removes his sandals from his feet,” how could you, who wish to see and converse with the One who is beyond all perception and concept, not remove every compulsive thought? " mp3="../media/old/evagrius.onprayer.004.mp3" name="Evagrius On Prayer 004"
# import_meditation
text="Persist first in prayer to receive tears, so that through this grief you can tame the wildness that resides in your soul and so that by “testifying against yourself of your lawlessness to the Lord” you obtain from him release." mp3="../media/old/evagrius.onprayer.005.mp3" name="Evagrius On Prayer 005"
# import_meditation
text="Use tears to correct every request, as the Lord takes great delight in receiving a prayer born of tears." mp3="../media/old/evagrius.onprayer.006.mp3" name="Evagrius On Prayer 006"
# import_meditation
text="Even if you pour out streams of tears in your prayer, you should *never* become conceited, as though you were superior to others. After all, your prayer has simply received additional support so that through tears you can more freely confess your sins and find reconciliation with God. Therefore, do not turn into a compulsion what should be a fortress against compulsion. Otherwise you’ll anger further the One who has bestowed on you this gift." mp3="../media/old/evagrius.onprayer.007.mp3" name="Evagrius On Prayer 007"
# import_meditation
text="While weeping for their sins many people forget the point of tears and get all turned around in their madness." mp3="../media/old/evagrius.onprayer.008.mp3" name="Evagrius On Prayer 008"
# import_meditation
text="Stand with diligence, persist in prayer with resolution, and continually turn away the attacks of cares and worrying thoughts. These vex and throng about you to sap away your resolution." mp3="../media/old/evagrius.onprayer.009.mp3" name="Evagrius On Prayer 009"
# import_meditation
text="When demons see you desiring truly to carry out your prayer, they suggest thoughts of various tasks that seem necessary and soon stir up your memory about them, thereby moving the mind to seek after them. When it doesn’t find them, it gets upset and loses heart. When it then stands for prayer, they remind it of memories and these objects of seeking, so that the mind goes slack for this knowledge and loses the prayer that is truly fruitful. " mp3="../media/old/evagrius.onprayer.010.mp3" name="Evagrius On Prayer 010"
# import_meditation
text="Strive to have your mind stand deaf and speechless at the time of prayer, and you will be able to pray." mp3="../media/old/evagrius.onprayer.011.mp3" name="Evagrius On Prayer 011"
# import_meditation
text="Whenever a temptation comes your way or a dispute incites you to release your anger in revenge or shout some unfitting word, recall your prayer and the clarity of discernment you have during it. At once, the uncontrolled emotion within you will cease." mp3="../media/old/evagrius.onprayer.012.mp3" name="Evagrius On Prayer 012"
# import_meditation
text="Whatever you do to avenge yourself against a brother who has treated you wrongly will become a hurdle to you in the time of prayer." mp3="../media/old/evagrius.onprayer.013.mp3" name="Evagrius On Prayer 013"
# import_meditation
text="Prayer is rooted in gentleness and the lack of anger." mp3="../media/old/evagrius.onprayer.014.mp3" name="Evagrius On Prayer 014"
# import_meditation
text="Prayer is the the leafy growth of joy and thanksgiving." mp3="../media/old/evagrius.onprayer.015.mp3" name="Evagrius On Prayer 015"
# import_meditation
text="Prayer is a guard against grief and despondency." mp3="../media/old/evagrius.onprayer.016.mp3" name="Evagrius On Prayer 016"
# import_meditation
text="Go, sell your possessions, and give them to the poor. Then take up your cross and deny yourself so that you can carry out your prayer without distraction." mp3="../media/old/evagrius.onprayer.017.mp3" name="Evagrius On Prayer 017"
# import_meditation
text="If you want to carry out your prayer in a laudable way, deny yourself hour by hour, and bear philosophically all manner of terrible things for the sake of prayer." mp3="../media/old/evagrius.onprayer.018.mp3" name="Evagrius On Prayer 018"
# import_meditation
text="Whenever you withstand hardship philosophically, you will find the fruit of this at the time of prayer." mp3="../media/old/evagrius.onprayer.019.mp3" name="Evagrius On Prayer 019"
# import_meditation
text="If you wish to pray as you ought, do not cause grief to any soul. Otherwise you are running in vain." mp3="../media/old/evagrius.onprayer.020.mp3" name="Evagrius On Prayer 020"
# import_meditation
text="He says, “Leave your gift before the altar, go, and first be reconciled to your brother.” Then when you come back you will pray without disturbance. For during prayer a grudge will mar the ruling faculty of the mind and cast a shadow over your prayers." mp3="../media/old/evagrius.onprayer.021.mp3" name="Evagrius On Prayer 021"
# import_meditation
text="Those who sweep up grudges and grief for themselves while thinking that they are praying are like those who draw water into a jar with holes." mp3="../media/old/evagrius.onprayer.022.mp3" name="Evagrius On Prayer 022"
# import_meditation
text="If you are patient, you will always pray with joy." mp3="../media/old/evagrius.onprayer.023.mp3" name="Evagrius On Prayer 023"
# import_meditation
text="While you are praying as you ought, situations will come to mind where you will think that you are entirely justified in using anger. Yet quite simply, there is no justified anger against your neighbor. For if you examine the situation, you'll find that it is possible for it to be resolved well even without anger. So use every means at your disposal not to break out in anger." mp3="../media/old/evagrius.onprayer.024.mp3" name="Evagrius On Prayer 024"
# import_meditation
text="See to it that while you think you are curing another you do not become incurable yourself and cut off the growth of your prayer." mp3="../media/old/evagrius.onprayer.025.mp3" name="Evagrius On Prayer 025"
# import_meditation
text="By being sparing with anger you will find yourself spared. You will show yourself to be prudent and will be counted among those who truly pray." mp3="../media/old/evagrius.onprayer.026.mp3" name="Evagrius On Prayer 026"
# import_meditation
text="As you are defending yourself against anger, you should never give into lust. For lust provides fuel to anger, which in turn disturbs the eye of the mind and ruins the state of prayer." mp3="../media/old/evagrius.onprayer.027.mp3" name="Evagrius On Prayer 027"
# import_meditation
text="Do not go about your prayer only by external postures. Instead, continually direct your mind with great reverence to an awareness of spiritual prayer." mp3="../media/old/evagrius.onprayer.028.mp3" name="Evagrius On Prayer 028"
# import_meditation
text="Sometimes when you stand for prayer you will immediately pray well. Other times, you won't obtain your aim even after striving hard. This is so that you will seek still further. Then, once you obtain it, you will hold this virtue inviolately. " mp3="../media/old/evagrius.onprayer.029.mp3" name="Evagrius On Prayer 029"
# import_meditation
text="When an angel is present, all those that besiege us depart at once and the mind finds itself much relaxed and praying in a healthy way. But other times the normal battle takes place, and the mind fights and refuses to relax, because it is stirred up by various compulsions. And yet, when it searches further, it will find what it seeks, for to the “one who knocks vigorously, the door will be opened.”  " mp3="../media/old/evagrius.onprayer.030.mp3" name="Evagrius On Prayer 030"
# import_meditation
text="Do not go on praying that your own desires come to pass, since they do not cohere perfectly with the desire of God. Instead, pray persistently as you have learned, “thy will be done in me.” In every endeavor, pray this way, so that his will would be done. After all, he desires what is good and beneficial for your soul. But quite often you do not pursue this." mp3="../media/old/evagrius.onprayer.031.mp3" name="Evagrius On Prayer 031"
# import_meditation
text="Take delight in the Lord always; I will say it again: take delight!" mp3="../media/old/paul.philippians.4.4.mp3" name="Philippians 4:4"
import_meditation
text="Show gentleness to all people. Our Lord is close by." mp3="../media/old/paul.philippians.4.5.mp3" name="Philippians 4:5"
import_meditation
text="Do not continue in anxious worrying. Instead, at all moments, present through prayer and petition your requests to God, and do this with gratitude. " mp3="../media/old/paul.philippians.4.6.mp3" name="Philippians 4:6"
import_meditation
text="Then God’s peace, which transcends every created mind mind, will protect, though Jesus Christ, your hearts and their thoughts. " mp3="../media/old/paul.philippians.4.7.mp3" name="Philippians 4:7"
import_meditation