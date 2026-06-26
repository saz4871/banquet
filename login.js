function showLogin(role)
{
    document.getElementById("popup").style.display="flex";
    document.getElementById("panelTitle").innerText=role+" Login";
    
    // Admin click par redirection attach karne ke liye logic
    const loginBtn = document.querySelector(".login-btn");
    if(role === 'Admin') {
        loginBtn.setAttribute("onclick", "enterAsAdmin()");
    } else {
        loginBtn.removeAttribute("onclick");
    }
}

function closePopup()
{
    document.getElementById("popup").style.display="none";
}

function enterAsUser()
{
    window.location.href="home.html";
}

function enterAsAdmin()
{
    window.location.href="admin.html";
}

window.onclick=function(e)
{
    if(e.target.id==="popup")
    {
        document.getElementById("popup").style.display="none";
    }
}