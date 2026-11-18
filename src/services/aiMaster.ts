import { Campaign, Scene, CharacterSheet, LoreEntity, ChatMessage, MapToken } from '../types';
import { OllamaService } from './ollama';

export interface TacticalActionExecuted {
  type: 'move' | 'roll' | 'damage' | 'heal' | 'status';
  description: string;
}

export interface TacticalExecutionResult {
  cleanedText: string;
  updatedScene: Scene;
  updatedCharacters: CharacterSheet[];
  rollsToExecute: Array<{ formula: string; desc: string }>;
  actionsExecuted: TacticalActionExecuted[];
}

export class AiMasterEngine {
  /**
   * Builds the comprehensive context prompt including world lore, scene, tokens, ruleset, and memories.
   */
  public static buildSystemPrompt(
    campaign: Campaign,
    activeScene: Scene,
    charactersInScene: CharacterSheet[],
    recentMessages: ChatMessage[],
    userQuery: string
  ): string {
    const rulesetName = campaign.ruleset === 'gurps' ? 'GURPS 4ª Edição (3d6)' : 'Dungeons & Dragons 5ª Edição (d20)';

    // Retrieve relevant Lore Entities
    const relevantLore = this.retrieveRelevantLore(campaign.loreEntities, userQuery, activeScene);

    // Build Detailed Spatial & Tactical Board Information
    const tokensWithChars = activeScene.tokens.map(token => {
      const char = charactersInScene.find(c => c.id === token.characterId) || {
        id: token.characterId,
        name: token.name,
        isNPC: true,
        hp: 10,
        maxHp: 10,
        defense: 10,
        conditions: token.statusConditions || [],
        bio: '',
        ruleset: campaign.ruleset
      } as CharacterSheet;

      // Find which zone token is inside
      const insideZone = activeScene.elevationZones.find(z =>
        token.x >= z.x && token.x < z.x + z.width &&
        token.y >= z.y && token.y < z.y + z.height
      );

      return { token, char, insideZone };
    });

    // Format Tactical Tokens List
    const tacticalBoardInfo = tokensWithChars.map(({ token, char, insideZone }) => {
      const typeStr = char.isNPC ? 'NPC / Inimigo' : 'Personagem Jogador (PJ)';
      const zoneStr = insideZone ? ` [Na Zona: "${insideZone.name}" (+${insideZone.elevation}m)]` : '';
      const elevStr = token.elevation ? ` [Altura: ${token.elevation > 0 ? '+' : ''}${token.elevation}m]` : ' [Térreo / 0m]';
      const condsStr = (token.statusConditions && token.statusConditions.length > 0)
        ? ` [Condições: ${token.statusConditions.join(', ')}]`
        : '';
      const defLabel = campaign.ruleset === 'gurps' ? 'Esquiva/Defesa' : 'Classe de Armadura (CA)';

      return `- **${token.name}** (${typeStr}):
  - Posição no Grid: Coluna X=${token.x}, Linha Y=${token.y}${elevStr}${zoneStr}
  - Status Vital: PV ${char.hp}/${char.maxHp} | ${defLabel}: ${char.defense}${condsStr}`;
    }).join('\n');

    // Format Distances Matrix between Combatants
    const distancesInfo: string[] = [];
    for (let i = 0; i < tokensWithChars.length; i++) {
      for (let j = i + 1; j < tokensWithChars.length; j++) {
        const t1 = tokensWithChars[i].token;
        const t2 = tokensWithChars[j].token;
        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;
        const distCells = Math.round(Math.hypot(dx, dy));
        const distMeters = (distCells * 1.5).toFixed(1);
        const heightDiff = (t1.elevation || 0) - (t2.elevation || 0);
        let heightNotice = '';
        if (heightDiff > 0) {
          heightNotice = ` (${t1.name} está ${heightDiff}m ACIMA de ${t2.name})`;
        } else if (heightDiff < 0) {
          heightNotice = ` (${t1.name} está ${Math.abs(heightDiff)}m ABAIXO de ${t2.name})`;
        }
        distancesInfo.push(`  - Entre ${t1.name} e ${t2.name}: ${distCells} células (~${distMeters} metros)${heightNotice}`);
      }
    }

    // Elevation zones in scene
    const zonesInfo = activeScene.elevationZones.length > 0
      ? activeScene.elevationZones.map(z => `- **${z.name}**: Área (${z.x},${z.y}) até (${z.x + z.width},${z.y + z.height}) com altura de ${z.elevation > 0 ? '+' : ''}${z.elevation}m`).join('\n')
      : 'Nenhuma elevação acentuada mapeada no momento.';

    // Lore memory injection
    const loreText = relevantLore.map(l => {
      return `[ENTIDADE: ${l.name.toUpperCase()} (${l.category})]
${l.description}
Tags: ${l.tags.join(', ')}
${l.knownByPlayers ? '(Fato conhecido pelos jogadores)' : '(SEGREDO: Jogadores ainda não sabem disto diretamente)'}`;
    }).join('\n\n');

    return `Você é o Mestre de RPG (Dungeon Master) oficial da mesa DoragonTable.
SEU PAPEL: Narrar o mundo com vivacidade cinematográfica, arbitrar combates táticos, movimentar NPCs pelo tabuleiro quando necessário e calcular os resultados de acordo com o sistema de regras.

=== SISTEMA DE REGRAS ===
Sistema: ${rulesetName}
${campaign.ruleset === 'gurps'
  ? 'Mecânica GURPS: Testes rolam 3d6 contra o Nível de Habilidade (NH) (menor ou igual é sucesso). Margem de sucesso/fracasso importa. Altura dá bônus tático (+1 se estiver acima, -1 se estiver abaixo). Alcance corpo a corpo é 1 hexágono (1 metro).'
  : 'Mecânica D&D 5e: Testes rolam 1d20 + modificador contra CA ou CD. Terreno elevado concede vantagem ou +2 na jogada de ataque. Alcance corpo a corpo padrão é 1 célula (1.5m / 5ft).'}

=== TABULEIRO TÁTICO & POSICIONAMENTO DA CENA ===
Cena: "${activeScene.name}" (${activeScene.width}x${activeScene.height} células, grid ${activeScene.gridType === 'hex' ? 'hexagonal' : 'quadrado'})
Descrição: ${activeScene.description || 'Ambiente tático de combate e exploração.'}

Zonas de Terreno e Elevação:
${zonesInfo}

Posições Exatas dos Personagens no Grid:
${tacticalBoardInfo || 'Nenhum token em cena.'}

Distâncias Táticas Calculadas:
${distancesInfo.length > 0 ? distancesInfo.join('\n') : '  - Apenas um personagem em cena.'}

=== BANCO DE MEMÓRIA DO MUNDO (LOREBOOK & FATOS REGISTRADOS) ===
${loreText || 'Nenhum registro antigo conflitante para este momento.'}

=== PROTOCOLO DE AÇÕES TÁTICAS DA IA (OBRIGATÓRIO PARA CONTROLAR O TABULEIRO) ===
Quando você narrar uma ação de um NPC (movimento, ataque, cura ou dano), você PODE E DEVE emitir comandos estruturados em tags no final da sua fala para que a mesa virtual atualize o mapa e a vida dos personagens automaticamente:
1. Mover NPC: \`[MOVE_NPC: NomeDoNPC, x, y, elevacao]\`
   Exemplo: Se o Arqueiro Orc recuar ou buscar terreno alto, inclua: \`[MOVE_NPC: Arqueiro Orc, 6, 8, 3]\`
2. Rolar Dado: \`[ROLL: formula, motivo]\`
   Exemplo: \`[ROLL: 1d20+4, Ataque com Espada Curta em Kaelen]\` ou \`[ROLL: 3d6, Teste de Arco]\`
3. Causar Dano: \`[DAMAGE: NomeDoAlvo, quantidade]\`
   Exemplo: Se o ataque acertar e causar 6 de dano: \`[DAMAGE: Kaelen, 6]\`
4. Curar: \`[HEAL: NomeDoAlvo, quantidade]\`
   Exemplo: \`[HEAL: Arqueiro Orc, 4]\`
5. Aplicar Condição: \`[STATUS: NomeDoAlvo, condicao]\`
   Condições válidas: \`ferido\`, \`caido\`, \`acelerado\`, \`invisivel\`, \`defesa\`, \`marcado\`, \`morto\`

=== DIRETRIZES DE NARRATIVA ===
1. Responda em Português do Brasil com tom imersivo, fluido e dinâmico.
2. Sempre respeite o posicionamento real do tabuleiro: quem está longe não pode ser atacado corpo a corpo sem mover-se primeiro!
3. Se um jogador tentar uma ação que exija teste, solicite o teste e mencione a CD/NH adequada.
4. Mantenha os turnos ágeis e repletos de perigo e suspense.`;
  }

  /**
   * Filters and sorts lore entities based on semantic relevance to current scene and user query.
   */
  private static retrieveRelevantLore(
    loreList: LoreEntity[],
    query: string,
    scene: Scene
  ): LoreEntity[] {
    const qLower = (query + ' ' + scene.name + ' ' + scene.description).toLowerCase();

    return loreList.filter(entity => {
      const nameMatch = qLower.includes(entity.name.toLowerCase());
      const tagMatch = entity.tags.some(tag => qLower.includes(tag.toLowerCase()));
      const descMatch = entity.description.toLowerCase().split(' ').some(word => word.length > 4 && qLower.includes(word));
      return nameMatch || tagMatch || descMatch;
    }).slice(0, 10);
  }

  /**
   * Parses action tags from AI response, updates the scene and characters, and cleans the text.
   */
  public static parseAndExecuteTacticalActions(
    rawText: string,
    activeScene: Scene,
    characters: CharacterSheet[]
  ): TacticalExecutionResult {
    let cleanedText = rawText;
    let nextScene: Scene = JSON.parse(JSON.stringify(activeScene));
    let nextCharacters: CharacterSheet[] = JSON.parse(JSON.stringify(characters));
    const rollsToExecute: Array<{ formula: string; desc: string }> = [];
    const actionsExecuted: TacticalActionExecuted[] = [];

    // Helper to find token by name (case-insensitive fuzzy)
    const findTokenByName = (name: string): MapToken | undefined => {
      const n = name.trim().toLowerCase();
      return nextScene.tokens.find(t => t.name.toLowerCase() === n || t.name.toLowerCase().includes(n) || n.includes(t.name.toLowerCase()));
    };

    // Helper to find character by name
    const findCharByName = (name: string): CharacterSheet | undefined => {
      const n = name.trim().toLowerCase();
      return nextCharacters.find(c => c.name.toLowerCase() === n || c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()));
    };

    // 1. Parse [MOVE_NPC: Name, x, y, elev]
    const moveRegex = /\[MOVE_NPC:\s*([^,]+),\s*(\d+),\s*(\d+)(?:,\s*(-?\d+))?\]/gi;
    let moveMatch;
    while ((moveMatch = moveRegex.exec(rawText)) !== null) {
      const name = moveMatch[1].trim();
      const x = parseInt(moveMatch[2], 10);
      const y = parseInt(moveMatch[3], 10);
      const elev = moveMatch[4] !== undefined ? parseInt(moveMatch[4], 10) : 0;

      const token = findTokenByName(name);
      if (token) {
        token.x = x;
        token.y = y;
        token.elevation = elev;
        actionsExecuted.push({
          type: 'move',
          description: `📍 **${token.name}** moveu-se para (${x}, ${y}) [Altura: ${elev > 0 ? '+' : ''}${elev}m]`
        });
      }
    }
    cleanedText = cleanedText.replace(moveRegex, '');

    // 2. Parse [ROLL: formula, desc]
    const rollRegex = /\[ROLL:\s*([^,]+),\s*([^\]]+)\]/gi;
    let rollMatch;
    while ((rollMatch = rollRegex.exec(rawText)) !== null) {
      const formula = rollMatch[1].trim();
      const desc = rollMatch[2].trim();
      rollsToExecute.push({ formula, desc });
      actionsExecuted.push({
        type: 'roll',
        description: `🎲 Rolagem Solicitada: **${formula}** (${desc})`
      });
    }
    cleanedText = cleanedText.replace(rollRegex, '');

    // 3. Parse [DAMAGE: TargetName, amount]
    const damageRegex = /\[DAMAGE:\s*([^,]+),\s*(\d+)\]/gi;
    let dmgMatch;
    while ((dmgMatch = damageRegex.exec(rawText)) !== null) {
      const targetName = dmgMatch[1].trim();
      const amount = parseInt(dmgMatch[2], 10);

      const targetChar = findCharByName(targetName);
      if (targetChar) {
        targetChar.hp = Math.max(0, targetChar.hp - amount);
        if (targetChar.hp === 0 && !targetChar.conditions.includes('caido')) {
          targetChar.conditions.push('caido');
        }
        actionsExecuted.push({
          type: 'damage',
          description: `💥 **${targetChar.name}** sofreu **${amount}** de dano (PV restante: ${targetChar.hp}/${targetChar.maxHp})`
        });
      }
    }
    cleanedText = cleanedText.replace(damageRegex, '');

    // 4. Parse [HEAL: TargetName, amount]
    const healRegex = /\[HEAL:\s*([^,]+),\s*(\d+)\]/gi;
    let healMatch;
    while ((healMatch = healRegex.exec(rawText)) !== null) {
      const targetName = healMatch[1].trim();
      const amount = parseInt(healMatch[2], 10);

      const targetChar = findCharByName(targetName);
      if (targetChar) {
        targetChar.hp = Math.min(targetChar.maxHp, targetChar.hp + amount);
        actionsExecuted.push({
          type: 'heal',
          description: `💚 **${targetChar.name}** recuperou **${amount}** PV (PV atual: ${targetChar.hp}/${targetChar.maxHp})`
        });
      }
    }
    cleanedText = cleanedText.replace(healRegex, '');

    // 5. Parse [STATUS: TargetName, condition]
    const statusRegex = /\[STATUS:\s*([^,]+),\s*([^\]]+)\]/gi;
    let statusMatch;
    while ((statusMatch = statusRegex.exec(rawText)) !== null) {
      const targetName = statusMatch[1].trim();
      const condition = statusMatch[2].trim().toLowerCase();

      const targetChar = findCharByName(targetName);
      const targetToken = findTokenByName(targetName);

      if (targetChar && !targetChar.conditions.includes(condition)) {
        targetChar.conditions.push(condition);
      }
      if (targetToken && (!targetToken.statusConditions || !targetToken.statusConditions.includes(condition))) {
        targetToken.statusConditions = [...(targetToken.statusConditions || []), condition];
      }

      actionsExecuted.push({
        type: 'status',
        description: `✨ Condição aplicada a **${targetName}**: *${condition}*`
      });
    }
    cleanedText = cleanedText.replace(statusRegex, '');

    // Clean up excessive blank lines left by tag removal
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();

    return {
      cleanedText,
      updatedScene: nextScene,
      updatedCharacters: nextCharacters,
      rollsToExecute,
      actionsExecuted
    };
  }

  /**
   * Generates a narration or reaction from the AI Master.
   */
  public static async narrate(
    campaign: Campaign,
    activeScene: Scene,
    charactersInScene: CharacterSheet[],
    recentMessages: ChatMessage[],
    userMessage: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(
      campaign,
      activeScene,
      charactersInScene,
      recentMessages,
      userMessage
    );

    const history = recentMessages.slice(-8).map(msg => ({
      role: (msg.isAI ? 'assistant' : 'user') as 'assistant' | 'user',
      content: `${msg.senderName}: ${msg.content}`
    }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: userMessage }
    ];

    const model = campaign.aiSettings?.model || 'fluffy/llama-3.1-8b-stheno-v3.4:latest';
    const temp = campaign.aiSettings?.temperature ?? 0.7;

    return await OllamaService.generateChatResponse(model, messages, temp, onChunk);
  }

  /**
   * Specifically triggers an NPC's combat turn when running in AI Master mode.
   */
  public static async narrateNpcTurn(
    campaign: Campaign,
    activeScene: Scene,
    charactersInScene: CharacterSheet[],
    recentMessages: ChatMessage[],
    npcChar: CharacterSheet,
    roundNumber: number,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const prompt = `[TURNO DE COMBATE - RODADA ${roundNumber}]
É o turno de ação de **${npcChar.name}** (${npcChar.isNPC ? 'Inimigo / NPC' : 'Aliado'}).
PV Atual: ${npcChar.hp}/${npcChar.maxHp}. Condições: ${npcChar.conditions.join(', ') || 'Nenhuma'}.

INSTRUÇÕES DO TURNO:
1. Analise o tabuleiro e decida taticamente a melhor jogada para ${npcChar.name}.
2. Se necessário aproximar-se ou recuar para uma melhor posição no grid, use a tag \`[MOVE_NPC: ${npcChar.name}, x, y, elevação]\`.
3. Escolha uma ação de ataque ou magia contra um dos oponentes em alcance e use \`[ROLL: fórmula, motivo]\` para fazer a jogada.
4. Se o ataque for acertar, use \`[DAMAGE: NomeDoAlvo, quantidade]\`.
5. Seja dramático, descreva os sons, movimentos e a expressão do NPC em 1 a 2 parágrafos envolventes!`;

    return await this.narrate(
      campaign,
      activeScene,
      charactersInScene,
      recentMessages,
      prompt,
      onChunk
    );
  }

  /**
   * Analyzes an event or narrative turn and extracts potential new lore entities to save in the world bible.
   */
  public static async extractNewEntities(
    campaign: Campaign,
    narrativeText: string
  ): Promise<LoreEntity[]> {
    try {
      const prompt = `Analise a narração a seguir e identifique novos fatos marcantes, NPCs revelados, itens especiais ou locais criados.
Retorne APENAS um array JSON de objetos com o formato:
[
  {
    "name": "Nome da Entidade ou Fato",
    "category": "npc" ou "location" ou "faction" ou "item" ou "event" ou "secret",
    "description": "Resumo objetivo do que é ou do que aconteceu",
    "tags": ["tag1", "tag2"],
    "knownByPlayers": true
  }
]
Se não houver novos fatos ou entidades significativas, retorne [].

Narração:
"${narrativeText.replace(/"/g, '\\"')}"`;

      const res = await OllamaService.generateChatResponse(
        campaign.aiSettings?.model || 'fluffy/llama-3.1-8b-stheno-v3.4:latest',
        [
          { role: 'system', content: 'Você é um assistente de arquivamento de campanhas de RPG. Responda apenas JSON puro.' },
          { role: 'user', content: prompt }
        ],
        0.2
      );

      const jsonMatch = res.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          id: 'lore_' + Math.random().toString(36).substring(2, 9),
          name: item.name,
          category: item.category || 'event',
          description: item.description,
          tags: Array.isArray(item.tags) ? item.tags : [],
          lastUpdated: new Date().toLocaleDateString('pt-BR'),
          knownByPlayers: item.knownByPlayers ?? true,
        }));
      }
    } catch (err) {
      console.warn('Failed to auto-extract lore entities:', err);
    }
    return [];
  }
}
