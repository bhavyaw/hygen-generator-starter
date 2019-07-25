import React, { useState } from 'react';
import "./Options.scss";
import Styles from "./OptionsContainer.module.scss";

export default function OptionsContainer() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return (
    <div className={Styles.optionsWrapper}>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}