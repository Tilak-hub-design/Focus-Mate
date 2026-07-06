import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";
import logo from "../sqLogo.PNG";


function Login(){
    const navigate = useNavigate();
    const [username, setUser] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        //temp login until backend completed
        if(username === 'admin' && password === 'pass123'){
           navigate("/dashboard"); //redirect to dashboard page 
        }else{
            alert('Invalid username or password.');
        }
    };

    return(
        <div className="container">

            <div className="title-container">
            <h1 className='web-title'>FocusMate</h1>
           <img src={logo} alt="FocusMate Logo" className="logo" />
            </div>

            <div className="login-box"> 
                <h2>Login</h2>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username:</label>
                        <input
                        type="text"
                        placeholder = 'Enter Username'
                        value={username}
                        onChange={(e)=> setUser(e.target.value)}
                        required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                        type='password'
                        placeholder= "Enter Password"
                        value={password} 
                        onChange={(e)=>setPassword(e.target.value)}
                        required
                        />
                    </div>

                    <button type='submit'>Login</button>
                    </form>

                    <p className="signup"> {/* link to sign up page */}
                        <a href='#'>Click here to Sign Up</a>
                    </p>
            </div>
        </div>
    );  
}

export default Login;