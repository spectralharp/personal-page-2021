<?php
  $key = 'RGAPI-ada2b824-ae8b-441f-ab7c-a2b5ae216af7';

  $url = 'https://na1.api.riotgames.com/lol/';
  #$summoner_node = 'summoner/v3/summoners/by-name/Power_of_Pillow';
  $match_list_node = 'match/v3/matchlists/by-account/';
  $match_info_node = 'match/v3/matches/';

  #$get_summoner = callAPI('GET', $url . $summoner_node . '?api_key=' . $key, false);
  #$summoner = json_decode($get_summoner, true);

  #$account_id = $summoner['accountId'];
  $account_id = '231662978';

  $get_match = callAPI('GET', $url . $match_list_node . $account_id . '?api_key=' . $key, false);

  $match_list = json_decode($get_match, true);

  $get_time = array('matches' => array());

  foreach ($match_list['matches'] as $match) {
    $match_id = $match['gameId'];
    $get_match_info = callAPI('GET', $url . $match_info_node . $match_id . '?api_key=' . $key, false);
    $match_info = json_decode($get_match_info, true);
    $get_time['matches'][] = array('gameCreation' => $match_info['gameCreation'], 'gameDuration' => $match_info['gameDuration']);
  }

  $final = json_encode($get_time);
  header('Content-Type: application/json');
  echo $final;

  function callAPI($method, $url, $data){
   $curl = curl_init();

   switch ($method){
      case "POST":
         curl_setopt($curl, CURLOPT_POST, 1);
         if ($data)
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
         break;
      case "PUT":
         curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "PUT");
         if ($data)
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
         break;
      default:
         if ($data)
            $url = sprintf("%s?%s", $url, http_build_query($data));
   }

   // OPTIONS:
   curl_setopt($curl, CURLOPT_URL, $url);
   curl_setopt($curl, CURLOPT_HTTPHEADER, array(
      'APIKEY: RGAPI-0d776cca-89ac-48a2-880a-0b04e295cc39',
      'Content-Type: application/json',
   ));
   curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
   curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

   // EXECUTE:
   $result = curl_exec($curl);
   if(!$result){die("Connection Failure");}
   curl_close($curl);
   return $result;
  }

?>
