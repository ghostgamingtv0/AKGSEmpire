import React, { useEffect } from 'react';

const FacebookSDK = () => {
  useEffect(() => {
    // Check if SDK is already loaded
    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = function() {
      window.FB.init({
        appId      : '1814051289293227',
        cookie     : true,
        xfbml      : true,
        version    : 'v19.0'
      });
      window.FB.AppEvents.logPageView();   
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  }, []);

  return <div id="fb-root"></div>;
};

export default FacebookSDK;
