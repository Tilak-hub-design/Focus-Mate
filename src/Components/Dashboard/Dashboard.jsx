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

        <div className="dashboard-content"> {/* placeholder until dashboard further developed */}
            <h1>Welcome to FocusMate</h1>
            <p>Work in Progress..</p>
        </div>
    </div>
    );
}

export default Dashboard;