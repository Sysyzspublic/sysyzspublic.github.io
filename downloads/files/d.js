// 用户设置
        const userSettings = {
            downloadNode: 'default', // 默认下载节点
            darkMode: false // 默认浅色模式
        };

        // 检查本地存储中的设置
        if (localStorage.getItem('userSettings')) {
            Object.assign(userSettings, JSON.parse(localStorage.getItem('userSettings')));

            // 应用深色模式设置
            if (userSettings.darkMode) {
                document.documentElement.classList.add('dark');
                document.getElementById('darkModeToggle').checked = true;
            }

            // 设置下载节点选择
            document.getElementById('downloadNode').value = userSettings.downloadNode;
        }

        // 当前显示的文件
        let currentFiles = [...allFiles];
        // 选中的文件ID
        let selectedFileIds = new Set();

        // 渲染文件列表
        function renderFileList() {
            const fileListElement = document.getElementById('fileList');
            const emptyStateElement = document.getElementById('emptyState');
            const emptySearchStateElement = document.getElementById('emptySearchState');

            if (currentFiles.length === 0) {
                fileListElement.classList.add('hidden');

                // 根据是否在搜索中显示不同的空状态
                const searchInput = document.getElementById('searchInput').value.trim();
                if (searchInput) {
                    emptySearchStateElement.classList.remove('hidden');
                    emptyStateElement.classList.add('hidden');
                } else {
                    emptySearchStateElement.classList.add('hidden');
                    emptyStateElement.classList.remove('hidden');
                }
                return;
            }

            fileListElement.classList.remove('hidden');
            emptyStateElement.classList.add('hidden');
            emptySearchStateElement.classList.add('hidden');

            fileListElement.innerHTML = '';

            currentFiles.forEach(file => {
                const fileRow = document.createElement('div');
                fileRow.className = 'file-row-hover px-4 py-3 grid grid-cols-12 gap-4 items-center';
                fileRow.setAttribute('data-id', file.id);

                const isSelected = selectedFileIds.has(file.id);

                fileRow.innerHTML = `
          <div class="col-span-6 flex items-center">
            <input type="checkbox" class="file-checkbox mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600" ${isSelected ? 'checked' : ''}>
            <div class="flex items-center">
              <div class="${file.color} text-xl mr-3">
                <i class="fa-solid ${file.icon}"></i>
              </div>
              <div>
                <a href="${file.downloadUrls[userSettings.downloadNode]}" class="text-balance font-medium text-gray-800 hover:text-primary transition-colors download-link dark:text-white dark:hover:text-blue-400" download>
                  ${file.name}
                </a>
                <div class="text-xs text-gray-500 mt-0.5 dark:text-gray-400">${file.type}</div>
              </div>
            </div>
          </div>
          <div class="col-span-3 hidden md:block text-sm text-gray-500 dark:text-gray-400">${file.modified}</div>
          <div class="col-span-3 hidden md:block text-sm text-gray-500 dark:text-gray-400">${file.size}</div>
        `;

                fileListElement.appendChild(fileRow);
            });

            // 防止点击下载链接时文本变色
            document.querySelectorAll('.download-link').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const downloadUrl = this.getAttribute('href');
                    const fileName = this.textContent.trim();

                    // 创建并触发下载
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            });

            // 更新复选框事件监听
            updateCheckboxListeners();
            // 更新全选状态
            updateSelectAllState();
            // 更新下载按钮状态
            updateDownloadButton();
        }

        // 更新复选框事件监听
        function updateCheckboxListeners() {
            // 移除旧的事件监听
            document.querySelectorAll('.file-checkbox').forEach(checkbox => {
                checkbox.removeEventListener('change', handleFileCheckboxChange);
            });

            // 添加新的事件监听
            document.querySelectorAll('.file-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleFileCheckboxChange);
            });

            // 全选复选框事件监听
            document.getElementById('selectAll').removeEventListener('change', handleSelectAllChange);
            document.getElementById('selectAll').addEventListener('change', handleSelectAllChange);
        }

        // 处理文件复选框变化
        function handleFileCheckboxChange(e) {
            const checkbox = e.target;
            const fileRow = checkbox.closest('[data-id]');
            const fileId = parseInt(fileRow.getAttribute('data-id'));

            if (checkbox.checked) {
                selectedFileIds.add(fileId);
            } else {
                selectedFileIds.delete(fileId);
            }

            // 更新全选状态
            updateSelectAllState();
            // 更新下载按钮状态
            updateDownloadButton();
        }

        // 处理全选复选框变化
        function handleSelectAllChange(e) {
            const isChecked = e.target.checked;

            // 更新所有文件复选框状态
            document.querySelectorAll('.file-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });

            // 更新选中的文件ID
            selectedFileIds.clear();
            if (isChecked) {
                currentFiles.forEach(file => {
                    selectedFileIds.add(file.id);
                });
            }

            // 更新下载按钮状态
            updateDownloadButton();
        }

        // 更新全选状态
        function updateSelectAllState() {
            const selectAllCheckbox = document.getElementById('selectAll');
            const fileCheckboxes = document.querySelectorAll('.file-checkbox');

            if (fileCheckboxes.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.disabled = true;
                return;
            }

            selectAllCheckbox.disabled = false;

            const allChecked = Array.from(fileCheckboxes).every(checkbox => checkbox.checked);
            const noneChecked = Array.from(fileCheckboxes).every(checkbox => !checkbox.checked);

            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
        }

        // 更新下载按钮状态
        function updateDownloadButton() {
            const downloadFloatingBtn = document.getElementById('downloadFloatingBtn');
            const downloadCount = document.getElementById('downloadCount');

            if (selectedFileIds.size > 0) {
                downloadFloatingBtn.classList.remove('floating-action-hidden');
                downloadFloatingBtn.classList.add('floating-action-visible');
                downloadCount.textContent = `下载 (${selectedFileIds.size})`;
            } else {
                downloadFloatingBtn.classList.remove('floating-action-visible');
                downloadFloatingBtn.classList.add('floating-action-hidden');
            }
        }

        // 下载选中的文件
        function downloadSelectedFiles() {
            if (selectedFileIds.size === 0) {
                return;
            }

            const selectedFiles = currentFiles.filter(file => selectedFileIds.has(file.id));

            if (selectedFiles.length === 1) {
                // 单个文件直接下载
                const file = selectedFiles[0];
                const a = document.createElement('a');
                a.href = file.downloadUrls[userSettings.downloadNode];
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // 多个文件依次下载（浏览器可能会阻止多个弹出窗口，这是浏览器安全限制）
                selectedFiles.forEach((file, index) => {
                    setTimeout(() => {
                        const a = document.createElement('a');
                        a.href = file.downloadUrls[userSettings.downloadNode];
                        a.download = file.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, index * 300); // 间隔300毫秒依次下载
                });
            }
        }

        // 搜索文件
        function searchFiles(keyword) {
            keyword = keyword.toLowerCase().trim();

            if (!keyword) {
                // 如果关键词为空，显示所有文件
                currentFiles = [...allFiles];
            } else {
                // 过滤匹配的文件
                currentFiles = allFiles.filter(file =>
                    file.name.toLowerCase().includes(keyword)
                );
            }

            // 清除选中状态
            selectedFileIds.clear();

            renderFileList();
        }

        // 显示帮助弹窗
        function showHelpModal() {
            const helpModal = document.getElementById('helpModal');
            helpModal.classList.remove('hidden');
            helpModal.classList.add('flex');

            // 添加动画效果
            setTimeout(() => {
                const modalContent = helpModal.querySelector('.modal-content');
                modalContent.classList.add('modal-enter-active');
            }, 10);
        }

        // 隐藏帮助弹窗
        function hideHelpModal() {
            const helpModal = document.getElementById('helpModal');
            const modalContent = helpModal.querySelector('.modal-content');

            // 添加退出动画
            modalContent.classList.remove('modal-enter-active');
            modalContent.classList.add('modal-exit-active');

            // 动画结束后隐藏
            setTimeout(() => {
                helpModal.classList.remove('flex');
                helpModal.classList.add('hidden');
                modalContent.classList.remove('modal-exit-active');
            }, 300);
        }

        // 显示设置弹窗
        function showSettingsModal() {
            const settingsModal = document.getElementById('settingsModal');
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');

            // 添加动画效果
            setTimeout(() => {
                const modalContent = settingsModal.querySelector('.modal-content');
                modalContent.classList.add('modal-enter-active');
            }, 10);
        }

        // 保存设置并隐藏设置弹窗
        function saveSettings() {
            // 保存下载节点设置
            userSettings.downloadNode = document.getElementById('downloadNode').value;

            // 保存深色模式设置
            userSettings.darkMode = document.getElementById('darkModeToggle').checked;

            // 应用深色模式
            if (userSettings.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // 保存到本地存储
            localStorage.setItem('userSettings', JSON.stringify(userSettings));

            // 重新渲染文件列表以更新下载链接
            renderFileList();

            // 隐藏设置弹窗
            const settingsModal = document.getElementById('settingsModal');
            const modalContent = settingsModal.querySelector('.modal-content');

            // 添加退出动画
            modalContent.classList.remove('modal-enter-active');
            modalContent.classList.add('modal-exit-active');

            // 动画结束后隐藏
            setTimeout(() => {
                settingsModal.classList.remove('flex');
                settingsModal.classList.add('hidden');
                modalContent.classList.remove('modal-exit-active');
            }, 300);
        }

        // 初始化页面
        document.addEventListener('DOMContentLoaded', function () {
            renderFileList();

            // 移动端搜索框显示
            const mobileSearchBtn = document.querySelector('.fa-search').parentElement;
            const searchInput = document.querySelector('input[placeholder="搜索文件和文件夹..."]');

            mobileSearchBtn.addEventListener('click', function () {
                if (window.innerWidth < 768) {
                    searchInput.parentElement.classList.toggle('hidden');
                    searchInput.parentElement.classList.toggle('block');
                    searchInput.parentElement.classList.toggle('absolute');
                    searchInput.parentElement.classList.toggle('inset-x-4');
                    searchInput.parentElement.classList.toggle('top-16');
                    searchInput.parentElement.classList.toggle('z-50');
                    searchInput.parentElement.classList.toggle('bg-white');
                    searchInput.parentElement.classList.toggle('p-4');
                    searchInput.parentElement.classList.toggle('shadow-md');

                    if (!searchInput.parentElement.classList.contains('hidden')) {
                        searchInput.focus();
                    }
                }
            });

            // 搜索功能
            const searchInputElement = document.getElementById('searchInput');
            searchInputElement.addEventListener('input', function () {
                searchFiles(this.value);
            });

            // 清除搜索按钮
            const clearSearchBtn = document.getElementById('clearSearchBtn');
            clearSearchBtn.addEventListener('click', function () {
                searchInputElement.value = '';
                searchFiles('');
            });

            // 下载选中文件按钮
            const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
            downloadSelectedBtn.addEventListener('click', downloadSelectedFiles);

            // 帮助弹窗相关
            const helpBtn = document.getElementById('helpBtn');
            const closeHelpBtn = document.getElementById('closeHelpBtn');

            helpBtn.addEventListener('click', showHelpModal);
            closeHelpBtn.addEventListener('click', hideHelpModal);

            // 点击弹窗外部关闭
            document.getElementById('helpModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    hideHelpModal();
                }
            });

            // ESC键关闭弹窗
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    hideHelpModal();
                    if (document.getElementById('settingsModal').classList.contains('flex')) {
                        saveSettings();
                    }
                }
            });

            // 设置弹窗相关
            const settingsBtn = document.getElementById('settingsBtn');
            const saveSettingsBtn = document.getElementById('saveSettingsBtn');

            settingsBtn.addEventListener('click', showSettingsModal);
            saveSettingsBtn.addEventListener('click', saveSettings);

            // 点击弹窗外部保存设置
            document.getElementById('settingsModal').addEventListener('click', function (e) {
                if (e.target === this) {
                    saveSettings();
                }
            });

            // 深色模式切换
            const darkModeToggle = document.getElementById('darkModeToggle');
            darkModeToggle.checked = userSettings.darkMode;

            darkModeToggle.addEventListener('change', function () {
                // 实时预览深色模式变化
                if (this.checked) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            });
        });

        // 页脚年份
        document.getElementById('year').textContent = new Date().getFullYear(); 
