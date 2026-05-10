

        const preloadedIcons = {};
        for (const [key, path] of Object.entries(iconMappings)) {
            const img = new Image();
            img.src = path;
            preloadedIcons[key] = img;
        }

        function getIconHTML(itemName) {
            if (iconMappings[itemName]) {
                return `<img src="${iconMappings[itemName]}" class="inline-icon" alt="icon">`;
            }
            return "";
        }

        // NEW: Gets the style string if the item has one mapped
        function getStyleString(itemName) {
            const st = styleMappings[itemName];
            if (!st) return "";
            return `font-family: ${st.fontFamily}; color: ${st.color}; text-shadow: ${st.textShadow};`;
        }

        // UPDATED: Automatically applies the custom font and glow if it exists!
        function formatWithIcon(itemName) {
            if (!itemName) return "...";
            const styleStr = getStyleString(itemName);
            return `${getIconHTML(itemName)} <span style="${styleStr}">${itemName}</span>`;
        }

        // ==========================================
        // 2. AUDIO SYSTEM
        // ==========================================
// Pointing to the "Sounds" folder
const clickSound = new Audio('Sounds/click.wav');
        const hoverSound = new Audio('Sounds/hover.wav');
        const spinTickSound = new Audio('Sounds/SpinTick.wav'); 
        spinTickSound.volume = 0.1;
        const winSound = new Audio('Sounds/win.wav');

        function playClick() {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log("Audio blocked", e));
        }

        function playHover() {
            hoverSound.currentTime = 0;
            hoverSound.play().catch(e => console.log("Audio blocked", e));
        }

        // This is what the wheel animation actually uses!
        function playTick() {
            spinTickSound.currentTime = 0;
            spinTickSound.play().catch(e => console.log("Audio blocked", e));
        }

        function playWin() {
            winSound.currentTime = 0;
            winSound.play().catch(e => console.log("Audio blocked", e));
        }



    
        // 3. DATA SETUP
        // ==========================================
        const players = ["Hoang", "Linh", "Bendy", "Minh", "Quoc Anh",];

        // HERE IS YOUR SPECIFIC PATH SETUP! 
        // Just put the path to the image you want for each person in order.
        const playerBackgrounds = [
            "Images/hoangnew_bg.png",   // 0: Hoang's background
            "Images/linh_bg.png",    // 1: Linh's background
            "Images/bendy_bg.png",   // 2: Bendy's background
            "Images/minh_bg.png",    // 3: Minh's background
            "Images/quocanh_bg.png", // 4: Quoc Anh's background
           /* "Images/hoang_bg.png"      // 5: Dat's background*/
        ];

        // Now it automatically grabs the image from the list above!
        let playerStats = players.map((name, index) => ({ 
            char: "", 
            perk: "", 
            bgImage: playerBackgrounds[index] 
        }));
        
        let currentEnvironment = "Unknown";
        let currentPerkList = [...genericPerks];
        function pickRandom(arr, count) {
            let copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy.slice(0, count);
        }

        function getRandomColor() {
            const hue = Math.floor(Math.random() * 360);
            return `hsl(${hue}, 80%, 60%)`; 
        }

        // ==========================================
        // 4. RENDER & IMAGE UPLOAD LOGIC
        // ==========================================
        
        // Handle when a player uploads a background image
        function handleBGUpload(event, playerIndex) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    playerStats[playerIndex].bgImage = e.target.result;
                    renderPlayers(); // Redraw the UI immediately
                }
                reader.readAsDataURL(file);
            }
        }

     function renderPlayers() {
            const wrapper = document.getElementById('players-wrapper');
            let builtHTML = ""; 
            
            players.forEach((name, index) => {
                const charDisplay = formatWithIcon(playerStats[index].char);
                const perkDisplay = formatWithIcon(playerStats[index].perk);
                
                // Applies your specific background with a dark overlay so text is readable
            const bgStyle = playerStats[index].bgImage 
                    ? `background-image: url('${playerStats[index].bgImage}');` 
                    : "";

                // Notice: The upload input and label are totally gone! Same exact class names used.
                builtHTML += `
                    <div class="player-card pixel-box" style="${bgStyle}">
                        <div class="player-card-header">
                            <h3 class="pixel-font">${index + 1}. ${name}</h3>
                        </div>
                        
                        <div class="slot">
                            <span class="slot-label">Char:</span>
                            <span class="slot-value">${charDisplay}</span>
                            <button class="pixel-font pixel-btn remove-btn" onclick="playClick(); removeTrait(${index}, 'char')">X</button>
                        </div>
                        <div class="slot">
                            <span class="slot-label">Perk:</span>
                            <span class="slot-value">${perkDisplay}</span>
                            <button class="pixel-font pixel-btn remove-btn" onclick="playClick(); removeTrait(${index}, 'perk')">X</button>
                        </div>
                    </div>
                `;
            });
            wrapper.innerHTML = builtHTML;
        }

        function removeTrait(playerIndex, type) {
            playerStats[playerIndex][type] = "";
            renderPlayers();
        }

        function showModal(type, result) {
            let titleText = "RESULT ACQUIRED";
            if (type === "CHARACTER") titleText = "";
            if (type === "PERK") titleText = "";
            if (type === "ENVIRONMENT") titleText = "";
            
            document.getElementById('modalType').innerText = titleText;
            
            let epicHTML = "";
            if (iconMappings[result]) {
                epicHTML += `<img src="${iconMappings[result]}" class="modal-hero-icon" alt="winner">`;
            }
            
            // Apply custom styles to the big winner text!
            const styleStr = getStyleString(result);
            epicHTML += `<div class="modal-winner-name" style="${styleStr}">${result}</div>`;
            
            document.getElementById('modalResult').innerHTML = epicHTML;
            document.getElementById('resultModal').classList.add('active');

            // Play custom sound if it exists, otherwise play default beep
            if (audioMappings[result]) {
                const sfx = new Audio(audioMappings[result]);
                sfx.play();
            } else {
                playWin();
            }
        }

        function closeModal() {
            document.getElementById('resultModal').classList.remove('active');
        }

        // ==========================================
        // 5. SPINNER WHEEL CLASS
        // ==========================================
        class SpinnerWheel {
            constructor(canvasId, masterList, maxItems = 25) {
                this.canvas = document.getElementById(canvasId);
                this.canvas.width = 1000;
                this.canvas.height = 1000;
                this.ctx = this.canvas.getContext('2d');
                
                this.masterList = masterList;
                this.maxItems = maxItems;
                this.items = pickRandom(this.masterList, this.maxItems);
                this.currentAngle = 0;
                this.isSpinning = false;
                
                this.draw(); 
            }

            updateItems(newMasterList) {
                this.masterList = newMasterList;
                this.items = pickRandom(this.masterList, this.maxItems);
                this.currentAngle = 0;
                this.draw();
            }
                
            draw() {
                const cx = this.canvas.width / 2;
                const cy = this.canvas.height / 2;
                const radius = cx - 10;
                const sliceAngle = (Math.PI * 2) / this.items.length;

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                for (let i = 0; i < this.items.length; i++) {
                    this.ctx.save();
                    this.ctx.translate(cx, cy);
                    this.ctx.rotate(this.currentAngle + (i * sliceAngle));

                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.arc(0, 0, radius, 0, sliceAngle);
                    
                    if (!this.sliceColors) this.sliceColors = [];
                    if (!this.sliceColors[i]) this.sliceColors[i] = getRandomColor();
                    
                    this.ctx.fillStyle = this.sliceColors[i];
                    this.ctx.fill();
                    this.ctx.stroke();

                    this.ctx.rotate(sliceAngle / 2);
                    
                    let rightEdge = radius - 30; 
                    const itemName = this.items[i];
                    
                    if (preloadedIcons[itemName] && preloadedIcons[itemName].complete) {
                        const img = preloadedIcons[itemName];
                        const targetHeight = 60; 
                        const scaleFactor = targetHeight / img.naturalHeight;
                        const targetWidth = img.naturalWidth * scaleFactor;
                        
                        const imgX = rightEdge - targetWidth;
                        const imgY = -(targetHeight / 2);
                        this.ctx.drawImage(img, imgX, imgY, targetWidth, targetHeight);
                        
                        rightEdge = imgX - 15; 
                    }
                    
                    this.ctx.textAlign = "right";
                    this.ctx.textBaseline = "middle"; 
                    
                    // NEW: Apply Custom Fonts and Colors to the Wheel Canvas!
                    const customStyle = styleMappings[itemName];
                    this.ctx.font = customStyle ? customStyle.wheelFont : "bold 20px Arial";
                    
                    if (customStyle && customStyle.color) {
                        // Draw with a thick black outline so custom colors pop!
                        this.ctx.fillStyle = customStyle.color;
                        this.ctx.fillText(itemName, rightEdge, 0);
                        this.ctx.strokeStyle = "black";
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeText(itemName, rightEdge, 0);
                    } else {
                        // Default Black text
                        this.ctx.fillStyle = "#000";
                        this.ctx.fillText(itemName, rightEdge, 0);
                    }
                    
                    this.ctx.restore();
                }
            }

            spin(callback) {
                if (this.isSpinning) return;
                if (this.masterList) {
                    this.items = pickRandom(this.masterList, this.maxItems);
                }
                
                this.draw(); 
                this.isSpinning = true;
                playClick();

                const spinTime = 4000 + Math.random() * 1000;
                const spinAmount = Math.PI * 14 + Math.random() * Math.PI * 4;
                const startTime = performance.now();
                const startAngle = this.currentAngle;
                let lastTickAngle = startAngle;
                const sliceAngle = (Math.PI * 2) / this.items.length;

                const animate = (time) => {
                    let progress = (time - startTime) / spinTime;
                    if (progress > 1) progress = 1;
                    
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    this.currentAngle = startAngle + spinAmount * easeProgress;
                    
                    if (Math.floor(this.currentAngle / sliceAngle) > Math.floor(lastTickAngle / sliceAngle)) {
                        playTick();
                        lastTickAngle = this.currentAngle;
                    }

                    this.draw();

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.isSpinning = false;
                        const offsetAngle = (Math.PI * 1.5 - this.currentAngle) % (Math.PI * 2);
                        const normalizedAngle = offsetAngle < 0 ? offsetAngle + Math.PI * 2 : offsetAngle;
                        const winningIndex = Math.floor(normalizedAngle / sliceAngle);
                        setTimeout(() => callback(this.items[winningIndex]), 200);
                    }
                };
                requestAnimationFrame(animate);
            }
        }

        // ==========================================
        // 6. INITIALIZATION & BUTTON EVENTS
        // ==========================================
        
        setTimeout(() => {
            window.charWheel = new SpinnerWheel('charWheel', characters, 30);
            window.perkWheel = new SpinnerWheel('perkWheel', currentPerkList, 15);
            window.envWheel = new SpinnerWheel('envWheel', environments, 30);
        }, 150);

        document.getElementById('spinCharBtn').addEventListener('click', () => {
            window.charWheel.spin((winner) => {
                showModal("CHARACTER", winner);
                for (let i = 0; i < players.length; i++) {
                    if (playerStats[i].char === "") {
                        playerStats[i].char = winner;
                        renderPlayers();
                        break;
                    }
                }
            });
        });

        document.getElementById('spinPerkBtn').addEventListener('click', () => {
            window.perkWheel.spin((winner) => {
                showModal("PERK", winner);
                for (let i = 0; i < players.length; i++) {
                    if (playerStats[i].perk === "") {
                        playerStats[i].perk = winner;
                        renderPlayers();
                        break;
                    }
                }
            });
        });

        document.getElementById('spinEnvBtn').addEventListener('click', () => {
            window.envWheel.spin((winner) => {
                showModal("ENVIRONMENT", winner);
                currentEnvironment = winner;
                document.getElementById('envText').innerHTML = formatWithIcon(winner);
            });
        });

        function setSpecificPerks() {
            const searchInput = document.getElementById('perkSearch').value.toLowerCase().trim();
            if (specificPerks[searchInput]) {
                currentPerkList = specificPerks[searchInput];
                window.perkWheel.updateItems(currentPerkList);
            } else {
                alert("Character not found! Using current list.");
            }
        }

        function resetGenericPerks() {
            document.getElementById('perkSearch').value = "";
            currentPerkList = [...genericPerks];
            window.perkWheel.updateItems(currentPerkList);
        }

        function generateAIPrompt() {
            let promptText = "Between ";
            for (let i = 0; i < players.length; i++) {
                let char = playerStats[i].char || "No Character";
                let perk = playerStats[i].perk || "No Perk";
                promptText += `( ${players[i]} ${char}, with ( ${perk} ) )`;
                if (i < players.length - 1) promptText += ",\n";
            }
            promptText += `\nIn <${currentEnvironment}>`;
            document.getElementById('aiPromptOutput').value = promptText;
        }

        renderPlayers();
