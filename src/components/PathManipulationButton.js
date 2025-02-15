import { useState } from "react";
import paper from 'paper'; 

const PathManipulationButton = ({ enablePathManipulation }) => {
    const [isManipulationActive, setIsManipulationActive] = useState(false);

    const togglePathManipulation = () => {
        if (isManipulationActive) {
            console.log("❌ Path Manipulation Deactivated");
            paper.tool = null; // 🔥
        } else {
            console.log("✅ Path Manipulation Activated");
            enablePathManipulation(); // 
        }

        setIsManipulationActive(!isManipulationActive); // 상태 토글
    };

    return (
        <button
            onClick={togglePathManipulation}
            style={{
                marginRight: '5px',
                backgroundColor: isManipulationActive ? '#555' : '#ccc', // 🔥 활성화 시 진한 회색
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                cursor: 'pointer',
                transition: 'background 0.3s ease-in-out'
            }}
        >
            {isManipulationActive ? "Deactivate Manipulation" : "Activate Manipulation"}
        </button>
    );
};

export default PathManipulationButton;
