# 🚀 Meu Kanban Pessoal

Este projeto é uma aplicação web de Kanban pessoal, desenvolvida para auxiliar no gerenciamento de tarefas e projetos de forma visual e intuitiva. Inspirado nas metodologias ágeis, ele permite organizar atividades em diferentes estágios (colunas), acompanhar o progresso e manter o foco nas prioridades.

## ✨ **Funcionalidades Principais**

*   **Gerenciamento de Tarefas:**
    *   Crie novas tarefas com título, descrição, tipo (Bug, Melhoria, Nova Funcionalidade, Refatoração), prioridade (Baixa, Média, Alta), solicitante, responsável, prazo estimado e observações.
    *   Edite tarefas existentes para atualizar qualquer informação.
    *   Visualize detalhes completos de cada tarefa em um modal dedicado.
    *   Adicione e visualize comentários em cada tarefa para facilitar a comunicação e o registro de informações.
    *   Marque tarefas como "Concluídas" ou "Desmarque-as" para alternar seu status.
    *   Remova tarefas permanentemente.
*   **Board Kanban Interativo:**
    *   Organização visual das tarefas em colunas de status: **Backlog**, **Em Análise**, **Em Desenvolvimento**, **Em Testes**, ****Aguardando Aprovação**** e **Concluído**.
    *   Funcionalidade de **Drag-and-Drop** para mover tarefas facilmente entre as colunas, atualizando automaticamente seu status.
    *   Destaque visual para a área de drop durante o arrasto.
*   **Persistência de Dados:**
    *   Todas as tarefas e seus detalhes são salvos automaticamente no **Local Storage** do navegador, garantindo que suas informações não sejam perdidas ao fechar ou recarregar a página.
*   **Design Responsivo:**
    *   Interface adaptável a diferentes tamanhos de tela, proporcionando uma experiência de usuário consistente em desktops, tablets e smartphones.
*   **Feedback Visual:**
    *   Cards de tarefas com cores distintas na borda esquerda, indicando o status atual.
    *   Tags visuais para tipo de atividade e prioridade.

## 🌐 **Experimente o Kanban Pessoal**

Você pode acessar e experimentar a aplicação diretamente no seu navegador, sem necessidade de instalação:

👉 **[Acesse a Demonstração Online](https://jheydev.github.io/Kanban/)**

## 🛠️ **Tecnologias Utilizadas**

*   **HTML5:** Estrutura semântica da aplicação.
*   **CSS3:** Estilização completa da interface, incluindo responsividade e efeitos visuais.
*   **JavaScript:** Lógica de programação para todas as funcionalidades interativas, manipulação do DOM, gerenciamento de estado e persistência de dados.
*   **Font Awesome:** Ícones utilizados para aprimorar a usabilidade e o design.

## 🚀 **Como Rodar o Projeto Localmente**

Para rodar o projeto em sua máquina, siga estes passos:

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/jheydev/Kanban.git
    ```
2.  **Navegue até o Diretório:**
    ```bash
    cd Kanban
    ```
3.  **Abra o `index.html`:**
    Simplesmente abra o arquivo `index.html` em seu navegador web preferido. Não é necessário um servidor web, pois a aplicação é puramente front-end.

## 💡 **Estrutura do Projeto**

*   `index.html`: Contém a estrutura principal da página, incluindo o board Kanban, modais e referências aos arquivos CSS e JavaScript.
*   `style.css`: Define todos os estilos visuais da aplicação, desde o layout geral até os detalhes dos cards e modais, além da responsividade.
*   `script.js`: Implementa toda a lógica interativa, como a criação, edição, remoção e movimentação de tarefas, gerenciamento de modais, comentários e persistência de dados no Local Storage.

## 🤝 **Contribuição**

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues para sugestões de melhoria ou pull requests com novas funcionalidades.

## 📄 **Licença**

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.