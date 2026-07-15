# Raffle Drum 抽籤系統驗收測試手冊 (acceptance.md)

本手冊提供三個階段的驗收測試步驟，確保系統在本地環境、Docker 容器以及 Kubernetes 集群中皆能正常運作，並特別驗收**多人即時同步**與**資料持久化**功能。

---

## 1. 第一階段：本地開發與單元測試 (Local Test)

本階段驗收本地前端與後端之依賴安裝、單元測試，以及網頁能否成功啟動並展現 Host/Viewer 的同步與防呆邏輯。

### 驗收步驟：
1.  **安裝依賴套件**：
    在專案根目錄下（或分別在 `frontend` 與 `backend` 目錄下）執行安裝。本專案將在根目錄配置 npm workspaces 或快速啟動腳本。
    ```bash
    npm install
    ```
2.  **執行單元測試**：
    執行前端與後端的測試，驗證隨機抽籤算法的公正性、不重複抽取限制、以及 API 寫入邏輯。
    ```bash
    npm test
    ```
    *預期結果*：所有測試案例皆應呈現綠色 PASS。
3.  **啟動本地開發伺服器**：
    在根目錄執行一鍵啟動指令（會同時啟動前端 Vite 與後端 Node 服務）：
    ```bash
    npm run dev
    ```
    *預期結果*：
    *   前端 Vite 運行在 `http://localhost:5173`。
    *   後端 Node/Socket.IO 伺服器運行在 `http://localhost:5000`。
4.  **多人即時同步手動測試**：
    *   **雙瀏覽器視窗測試**：
        1.  打開瀏覽器視窗 A，輸入網址 `http://localhost:5173/?role=host`（主持人角色）。
        2.  打開瀏覽器視窗 B（或使用無痕視窗），輸入網址 `http://localhost:5173`（觀眾角色）。
    *   **同步修改驗證**：
        *   在視窗 A (Host) 的輸入框中輸入名單：`Apple, Banana, Cherry, Durian`，並調整設定。
        *   *預期結果*：視窗 B (Viewer) 的大螢幕上會即時顯現這 4 個候選項目。
    *   **同步抽籤驗證**：
        *   在視窗 A 點擊 "START DRAW"。
        *   *預期結果*：視窗 A 與 視窗 B 會**同時**播放高速文字滾動動畫。動畫結束後，兩邊同時噴灑 Confetti，並同步彈出同一個得獎者 (例如 `Banana`)。
    *   **防呆邏輯驗證**：
        *   在視窗 A 將「單次抽取人數」設為 5，並開啟「重複限制（不重複）」。確認按鈕變為 Disabled，且顯示警告。

---

## 2. 第二階段：Docker Compose 容器化與持久化測試 (Docker Compose & Persistence Test)

本階段驗收 Dockerfile 建置、Docker Compose 一鍵啟動，以及最關鍵的**資料持久化**（重啟容器後資料不消失）。

### 驗收步驟：
1.  **建置並啟動服務**（可在專案根目錄執行，或切換至 `deploy/docker` 目錄執行 `docker compose up --build -d`）：
    ```bash
    docker compose -f deploy/docker/docker-compose.yml up --build -d
    ```
2.  **確認容器與埠口**：
    ```bash
    docker compose -f deploy/docker/docker-compose.yml ps
    ```
    *預期結果*：`raffle-frontend` (Port 3000) 與 `raffle-backend` (Port 5000) 狀態皆為 `Up`。
3.  **持久化驗證測試**：
    1.  瀏覽 `http://localhost:3000/?role=host`。
    2.  輸入測試項目：`UserA, UserB, UserC, UserD`。
    3.  執行一次抽籤，使其產生得獎歷史紀錄（例如 `UserA` 中獎）。
    4.  **強制重啟後端服務**：
        ```bash
        docker compose -f deploy/docker/docker-compose.yml restart backend
        ```
    5.  重整瀏覽器頁面 `http://localhost:3000`。
    *預期結果*：網頁載入後，輸入框內依然保留 `UserA, UserB, UserC, UserD`，且歷史紀錄中依然留有剛才中獎的 `UserA`。這代表資料已成功透過掛載的 `state.json` 檔案持久化。
4.  **清理環境**：
    ```bash
    docker compose -f deploy/docker/docker-compose.yml down
    ```

---

## 3. 第三階段：Kubernetes 部署測試 (K8S Deployment Test)

本階段驗收 Kubernetes 清單能否在 K8S 集群中順利部署，且服務能透過 Nginx 反向代理或內網 Service Name 串接 WebSockets。

### 驗收步驟：
1.  **啟動本地 K8S 集群**：
    ```bash
    minikube start
    ```
2.  **在本地建置 Docker 映像檔**：
    分別打包前端與後端的 Docker Image：
    ```bash
    docker build -t raffle-frontend:latest -f deploy/docker/Dockerfile.frontend .
    docker build -t raffle-backend:latest -f deploy/docker/Dockerfile.backend .
    ```
3.  **將映像檔載入 Minikube**：
    ```bash
    minikube image load raffle-frontend:latest
    minikube image load raffle-backend:latest
    ```
4.  **套用 Kubernetes 部署清單**：
    ```bash
    kubectl apply -f deploy/k8s/namespace.yaml
    kubectl apply -f deploy/k8s/
    ```
5.  **檢查 Pod 與 Service 狀態**：
    ```bash
    kubectl get pods -n raffle-system
    kubectl get svc -n raffle-system
    ```
    *預期結果*：前端與後端 Pod 狀態為 `Running`，且 `raffle-frontend-service` 與 `raffle-backend-service` 已成功啟動。
6.  **測試存取與多人同步**：
    獲取前端服務網址：
    ```bash
    minikube service raffle-frontend-service -n raffle-system
    ```
    開啟兩個分頁，重複「第一階段」的雙瀏覽器視窗同步測試，確認 K8S 內部的 WebSocket 反向代理與 Pod 網路串接完全正常。
7.  **清理 K8S 部署**：
    ```bash
    kubectl delete -f deploy/k8s/
    ```
