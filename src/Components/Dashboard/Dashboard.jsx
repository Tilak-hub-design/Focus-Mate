import "./Dashboard.css";

function Dashboard(){
    return(
    <div className="dashboard">
        <nav className="nav-bar">
            <h2 className="nav-title">FocusMate</h2>

                <ul className="links">
                    <li><a href="#">Home</a></li> {/* add links later, but for layout*/}
                    <li><a href="#">Tasks</a></li>
                    <li><a href="#">Calendar</a></li>
                    <li><a href="#">Focus</a></li>
                    <li><a href="#">Profile</a></li>
                    <li><a href="#">Logout</a></li>
                </ul>
        </nav>
        <h1>Welcome to FocusMate</h1>
        <div className="dashboard-content"> {/* placeholder until dashboard further developed */}
            
                <div className="task-box">
                <h2>Tasks</h2>
                <ul className="task-list">
                    <li>Task 1</li> {/* placeholder tasks until backend */}
                    <li>Task 2</li>
                    <li>Task 3</li>
                </ul>
            </div>

            <div className="timer-box"> {/* Functionality a work in progress*/}
                <h3>Start Study Session?</h3>
                <div className ="timer-display"> {/*Temp display */}
                    <p>25:00</p>
                </div>

                <div className ="timer-buttons">
                    <button> Start</button>
                </div>

            </div>
        </div>
    </div>


    );
}

export default Dashboard;