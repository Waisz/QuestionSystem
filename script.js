function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
}

//  測驗功能
let selectedQuestions = [];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadQuestions() {
  const key = document.getElementById("quizKeyInput").value.trim();
  const desiredCount = parseInt(document.getElementById("questionInput").value);
  const pool = JSON.parse(localStorage.getItem(key));

  if (!pool || pool.length === 0) return alert("❌ 題庫為空或不存在！");
  if (isNaN(desiredCount) || desiredCount <= 0) return alert("❌ 請輸入有效題數！");
  if (desiredCount > pool.length) return alert(`❌ 題庫僅有 ${pool.length} 題，無法抽取 ${desiredCount} 題。`);

  selectedQuestions = shuffle([...pool]).slice(0, desiredCount);
  document.getElementById("quizForm").style.display = "block";

  const container = document.getElementById("quizContainer");
  container.innerHTML = "";

  selectedQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question-block";

    const shuffledChoices = shuffle([...q.choices]);

    // 題目標題
    const title = document.createElement("h3");
    title.textContent = `第 ${i + 1} 題`;
    div.appendChild(title);

    // 題目內容
    const questionText = document.createElement("p");
    questionText.textContent = q.question;
    div.appendChild(questionText);

    // 選項
    shuffledChoices.forEach(choice => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.margin = "6px 0";
      label.style.padding = "8px";
      label.style.borderRadius = "5px";
      label.style.background = "#2c2c3c";
      label.style.border = "1px solid #555";
      label.style.cursor = "pointer";

      label.onmouseover = () => label.style.background = "#3a3a4a";
      label.onmouseout = () => label.style.background = "#2c2c3c";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${i}`;
      input.value = choice;
      input.required = true;
      input.style.marginRight = "8px";

      label.appendChild(input);
      label.appendChild(document.createTextNode(choice));
      div.appendChild(label);
    });

    container.appendChild(div);
  });
}

function submitQuiz(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  let score = 0;
  const resultDetails = [];

  selectedQuestions.forEach((q, i) => {
    const selected = formData.get(`q${i}`);
    const isCorrect = selected === q.answerText;
    if (isCorrect) score++;

    resultDetails.push({
      number: i + 1,
      question: q.question,
      yourAnswer: selected || "（未選擇）",
      correctAnswer: q.answerText,
      correct: isCorrect
    });
  });

  const total = selectedQuestions.length;
  const percent = Math.round((score / total) * 100);
  let resultHTML = `<h2>✅ 測驗完成，你的分數是 ${score} / ${total}（${percent}%）</h2><hr/>`;

  resultDetails.forEach(item => {
    resultHTML += `
      <div style="margin-bottom:10px;">
        <strong>第 ${item.number} 題：</strong> ${item.question}<br/>
        你的答案：${item.yourAnswer}<br/>
        正確答案：${item.correctAnswer}<br/>
        ${item.correct ? "<span style='color:lightgreen'>✅ 正確</span>" : "<span style='color:salmon'>❌ 錯誤</span>"}
      </div>
    `;
  });

  document.getElementById("resultContent").innerHTML = resultHTML;
  document.getElementById("resultOverlay").style.display = "block";
  document.getElementById("quizForm").style.display = "none";
}

function closeOverlay() {
  document.getElementById("resultOverlay").style.display = "none";
}

//  批量新增題目
function addBatchQuestion() {
  const container = document.getElementById("batchContainer");
  const index = container.children.length;
  const div = document.createElement("div");
  div.className = "question-block";
  div.innerHTML = `
    <strong>第 ${index + 1} 題</strong><br>
    <input type="text" placeholder="題目內容" class="q-text"><br>
    <input type="text" placeholder="選項 1" class="q-choice"><br>
    <input type="text" placeholder="選項 2" class="q-choice"><br>
    <input type="text" placeholder="選項 3" class="q-choice"><br>
    <input type="text" placeholder="選項 4" class="q-choice"><br>
    <input type="text" placeholder="正確答案（需與選項一致）" class="q-answer"><br>
  `;
  container.appendChild(div);
}

function saveBatchQuestions() {
  const key = document.getElementById("batchKey").value.trim();
  if (!key) return alert("❌ 請輸入題庫密鑰！");
  const blocks = document.querySelectorAll("#batchContainer .question-block");
  const newQuestions = [];

  blocks.forEach(block => {
    const question = block.querySelector(".q-text").value.trim();
    const choices = Array.from(block.querySelectorAll(".q-choice")).map(c => c.value.trim());
    const answerText = block.querySelector(".q-answer").value.trim();
    if (!question || choices.some(c => !c) || !answerText || !choices.includes(answerText)) return;

    newQuestions.push({ question, choices, answerText });
  });

  if (newQuestions.length === 0) return alert("❌ 沒有有效題目可儲存！");
  const existing = JSON.parse(localStorage.getItem(key)) || [];
  localStorage.setItem(key, JSON.stringify(existing.concat(newQuestions)));
  alert(`✅ 已儲存 ${newQuestions.length} 題至題庫「${key}」`);
  document.getElementById("batchContainer").innerHTML = "";
}

// 題庫管理
function loadQuestionBank() {
  const key = document.getElementById("editKeyInput").value.trim();
  const pool = JSON.parse(localStorage.getItem(key));
  if (!pool || pool.length === 0) return alert("❌ 題庫為空或不存在！");

  const container = document.getElementById("editContainer");
  container.innerHTML = `<h3>🔧 題庫：${key}</h3>`;

  pool.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question-block";
    div.innerHTML = `
      <label>題目：</label>
      <textarea onchange="updateQuestion('${key}', ${index}, 'question', this.value)">${q.question}</textarea>
      ${q.choices.map((c, i) => `
        <label>選項 ${i + 1}：</label>
        <input type="text" onchange="updateChoice('${key}', ${index}, ${i}, this.value)" value="${c}"><br>
      `).join("")}
      <label>正確答案：</label>
      <input type="text" onchange="updateQuestion('${key}', ${index}, 'answerText', this.value)" value="${q.answerText}"><br>
      <button onclick="deleteQuestion('${key}', ${index})">🗑️ 刪除此題</button>
    `;
    container.appendChild(div);
  });
}

function updateQuestion(key, index, field, value) {
  const pool = JSON.parse(localStorage.getItem(key));
  pool[index][field] = value.trim();
  localStorage.setItem(key, JSON.stringify(pool));
}

function updateChoice(key, index, choiceIndex, value) {
  const pool = JSON.parse(localStorage.getItem(key));
  pool[index].choices[choiceIndex] = value.trim();
  localStorage.setItem(key, JSON.stringify(pool));
}

function deleteQuestion(key, index) {
  if (!confirm("確定要刪除此題嗎？")) return;
  const pool = JSON.parse(localStorage.getItem(key));
  pool.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(pool));
  loadQuestionBank();
}

//  匯入 / 匯出
function exportQuestionBank() {
  const key = document.getElementById("importExportKey").value.trim();
  const pool = JSON.parse(localStorage.getItem(key));
  if (!pool || pool.length === 0) return alert("❌ 題庫為空或不存在！");

  const blob = new Blob([JSON.stringify(pool, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${key}_題庫.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importQuestionBank() {
  const file = document.getElementById("importFile").files[0];
  if (!file) return alert("❌ 請選擇 JSON 檔案！");

  const reader = new FileReader();
  reader.onload = function (e) {
    let importedData;

    try {
      // 嘗試解析原始 JSON
      importedData = JSON.parse(e.target.result);
    } catch (err) {
      const raw = e.target.result.trim();

      try {
        // 將每個物件分割
        const blocks = raw.split(/},\s*{/).map((block, i, arr) => {
          if (!block.startsWith("{")) block = "{" + block;
          if (!block.endsWith("}")) block = block + "}";

          // 加上雙引號
          block = block
            .replace(/(\w+):/g, '"$1":') // 欄位名稱加引號
            .replace(/"choices":\s*"([^"]+?)"(,)?/g, (_, str, comma) => {
              const arr = str.split(",").map(s => `"${s.trim()}"`);
              return `"choices":[${arr.join(",")}]${comma || ""}`;
            });

          return block;
        });

        const fixed = `[${blocks.join(",")}]`;
        importedData = JSON.parse(fixed);
        console.warn("⚠️ 已強化修正 JSON 格式");
      } catch (fixErr) {
        return alert("❌ 匯入失敗，無法修正 JSON 格式！");
      }
    }

    // 檢查是否為舊格式（question / choices / answerText）
    const isOldFormat = importedData.every(q =>
      typeof q.question === "string" &&
      Array.isArray(q.choices) &&
      typeof q.answerText === "string"
    );

    if (isOldFormat) {
      const key = prompt(" 偵測到舊版題庫格式，請輸入題庫密鑰以完成轉換：");
      if (!key) return alert("❌ 未輸入密鑰，匯入取消");

      const converted = importedData.map(q => ({
        key,
        question: q.question.trim(),
        choices: q.choices.map(c => c.trim()),
        answerText: q.answerText.trim()
      }));

      const existing = JSON.parse(localStorage.getItem(key)) || [];
      const merged = existing.concat(converted);
      localStorage.setItem(key, JSON.stringify(merged));

      document.getElementById("editKeyInput").value = key;
      alert(`✅ 已成功匯入 ${converted.length} 題至題庫「${key}」`);
      loadQuestionBank();
      return;
    }

    // 若為新格式，直接匯入
    const key = prompt("📥 請輸入題庫密鑰以匯入此題庫：");
    if (!key) return alert("❌ 未輸入密鑰，匯入取消");

    const existing = JSON.parse(localStorage.getItem(key)) || [];
    const merged = existing.concat(importedData);
    localStorage.setItem(key, JSON.stringify(merged));

    document.getElementById("editKeyInput").value = key;
    alert(`✅ 已成功匯入 ${importedData.length} 題至題庫「${key}」`);
    loadQuestionBank();
  };

  reader.readAsText(file);
}