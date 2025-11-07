# 📦 Estrutura Modular do Projeto

## Organização dos Arquivos

```
src/
├── js/
│   ├── modules/          # Módulos ES6 organizados por funcionalidade
│   │   ├── sound.js      # Sistema de sons e notificações
│   │   ├── pomodoro.js   # Cronômetro Pomodoro
│   │   ├── goals.js      # Gerenciador de metas (em desenvolvimento)
│   │   ├── gamification.js  # Sistema de gamificação (em desenvolvimento)
│   │   ├── calendar.js   # Calendário de tarefas (em desenvolvimento)
│   │   ├── settings.js   # Gerenciador de configurações (em desenvolvimento)
│   │   └── tasks.js      # Gerenciador de tarefas (em desenvolvimento)
│   ├── utils/            # Funções utilitárias compartilhadas
│   ├── main.js           # Arquivo principal de inicialização
│   └── index.js          # Código legado (será migrado gradualmente)
├── css/
│   └── style.css
└── img/
```

## Módulos Implementados

### 🔊 sound.js
**Classe:** `SoundSystem`

**Funcionalidades:**
- Sistema de geração de tons usando Web Audio API
- 8 tipos de sons diferentes (sucesso, level up, conquista, aviso, etc.)
- Controle de volume e ativação/desativação
- Persistência de configurações em localStorage

**Métodos principais:**
- `playSuccess()` - Som de tarefa completada
- `playLevelUp()` - Som de aumento de nível
- `playAchievement()` - Som de conquista desbloqueada
- `playWarning()` - Som de erro/aviso
- `playNotification()` - Som de notificação suave
- `playChallengeComplete()` - Som de desafio completado
- `playGoalComplete()` - Som de meta completada
- `playPomodoroComplete()` - Som do Pomodoro finalizado
- `toggle()` - Liga/desliga sons
- `setVolume(volume)` - Ajusta volume (0-1)

### ⏱️ pomodoro.js
**Classe:** `PomodoroTimer`

**Funcionalidades:**
- Técnica Pomodoro (25 min foco / 5 min pausa)
- Controles de iniciar, pausar e resetar
- Atualização do título da aba do navegador
- Notificações visuais e sonoras
- Animações de partículas na conclusão

**Métodos principais:**
- `start()` - Inicia o cronômetro
- `pause()` - Pausa o cronômetro
- `reset()` - Reseta para o tempo inicial
- `switchMode()` - Alterna entre foco e pausa
- `formatTime(seconds)` - Formata tempo em MM:SS

## Como Usar os Módulos

### Importando no HTML:
```html
<script type="module" src="src/js/main.js"></script>
```

### Importando em outro módulo:
```javascript
import { SoundSystem } from './modules/sound.js';
import { PomodoroTimer } from './modules/pomodoro.js';

const soundSystem = new SoundSystem();
soundSystem.playSuccess();

const pomodoro = new PomodoroTimer();
pomodoro.start();
```

### Uso Global (compatibilidade):
```javascript
// As classes também estão disponíveis globalmente via window
window.soundSystem = new SoundSystem();
window.pomodoroTimer = new PomodoroTimer();
```

## Benefícios da Modularização

✅ **Manutenibilidade**: Código organizado e fácil de encontrar
✅ **Reutilização**: Módulos podem ser usados em outros projetos
✅ **Testabilidade**: Cada módulo pode ser testado independentemente
✅ **Carregamento**: Melhor performance com imports assíncronos
✅ **Escalabilidade**: Fácil adicionar novos recursos sem poluir o código
✅ **Colaboração**: Múltiplos desenvolvedores podem trabalhar em módulos diferentes

## Próximos Passos

### Módulos a Serem Criados:

1. **goals.js** - Gerenciador de metas e objetivos
2. **gamification.js** - Sistema de conquistas, níveis e pontos
3. **calendar.js** - Calendário com visualização de tarefas
4. **settings.js** - Gerenciador de configurações e temas
5. **tasks.js** - Gerenciador principal de tarefas (TodoApp)
6. **utils.js** - Funções utilitárias compartilhadas

### Refatoração Gradual:

O arquivo `index.js` será gradualmente refatorado. A estratégia é:

1. ✅ Extrair classes independentes primeiro (SoundSystem, PomodoroTimer)
2. ⏳ Extrair classes com poucas dependências (GoalsManager, CalendarManager)
3. ⏳ Extrair classes com muitas dependências (GamificationSystem, TodoApp)
4. ⏳ Criar utils.js com funções compartilhadas
5. ⏳ Remover código duplicado do index.js
6. ⏳ Converter index.js em módulo ou removê-lo completamente

## Compatibilidade

Por enquanto, mantemos tanto os módulos quanto o `index.js` carregados para garantir que nada quebre durante a transição. Isso garante:

- ✅ Funcionalidades existentes continuam funcionando
- ✅ Código legado tem acesso às classes via window
- ✅ Novo código pode usar imports ES6
- ✅ Transição suave sem quebrar a aplicação

## Observações

- Todos os módulos usam `export` para tornar as classes disponíveis
- O `main.js` importa os módulos e os expõe globalmente via `window`
- localStorage é usado para persistência de configurações
- Eventos DOM são gerenciados dentro de cada classe
- Dependências externas (window, document, localStorage) são acessadas diretamente

---

**Última atualização:** Novembro 2025
**Status:** 🚧 Em desenvolvimento - Modularização parcial
**Progresso:** 2/8 módulos criados (25%)
