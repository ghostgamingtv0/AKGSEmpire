import React, { useState, useEffect } from 'react';
import ComingSoon from './components/ComingSoon';
import AKGS from './AKGS';

function App() {
  const [isPreLaunch, setIsPreLaunch] = useState(true);

  useEffect(() => {
    const checkLaunchStatus = () => {
      // Force unlock for testing - Change to true to show Coming Soon
      setIsPreLaunch(true);
    };
    
    checkLaunchStatus();
  }, []);

  if (isPreLaunch) {
    return <ComingSoon />;
  }

  return <AKGS />;
}

export default App;