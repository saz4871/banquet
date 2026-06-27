<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Banquet App</title>
    <style>
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Banquet App</h1>
    
    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
        <h3>Add New Banquet</h3>
        <input type="text" id="bankName" placeholder="Bank Name">
        <input type="text" id="bankLoc" placeholder="Location Name">
        <button id="addBtn">Add Entry</button>
    </div>

    <h3>Available Banquets</h3>
    <table>
        <thead>
            <tr>
                <th>Bank Name</th>
                <th>Location</th>
            </tr>
        </thead>
        <tbody id="tableBody">
            </tbody>
    </table>

    <script type="module">
        // Ab yahan sahi file name 'firebaseconfig.js' hai
        import { database } from './firebaseconfig.js';
        import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

        const tableBody = document.getElementById('tableBody');

        async function loadData() {
            const dbRef = ref(database, 'banquet');
            const snapshot = await get(dbRef);
            
            tableBody.innerHTML = ""; 
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    tableBody.innerHTML += `<tr>
                        <td>${data.bankname || 'N/A'}</td>
                        <td>${data.banklocnametext || 'N/A'}</td>
                    </tr>`;
                });
            } else {
                tableBody.innerHTML = "<tr><td colspan='2'>No data found</td></tr>";
            }
        }

        document.getElementById('addBtn').addEventListener('click', async () => {
            const name = document.getElementById('bankName').value;
            const loc = document.getElementById('bankLoc').value;

            if(name && loc) {
                const newEntryRef = push(ref(database, 'banquet'));
                await set(newEntryRef, {
                    bankname: name,
                    banklocnametext: loc
                });
                alert("Entry Added!");
                document.getElementById('bankName').value = "";
                document.getElementById('bankLoc').value = "";
                loadData(); 
            } else {
                alert("Please fill both fields!");
            }
        });

        loadData();
    </script>
</body>
</html>
