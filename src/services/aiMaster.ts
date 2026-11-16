import { Campaign, Scene, CharacterSheet, LoreEntity, ChatMessage } from '../types';
import { OllamaService } from './ollama';

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

    // Characters summary
    const charsInfo = charactersInScene.map(c => {
      const elev = c.elevation ? ` [Altura: ${c.elevation > 0 ? '+' : ''}${c.elevation}m]` : ' [Térreo / 0m]';
      const conds = c.conditions.length > 0 ? ` (Condições: ${c.conditions.join(', ')})` : '';
      return `- ${c.name} (${c.isNPC ? 'NPC' : 'PJ'}): PV ${c.hp}/${c.maxHp}${elev}${conds}. Bio: ${c.bio || 'Sem detalhes'}`;
    }).join('\n');

    // Elevation zones in scene
    const zonesInfo = activeScene.elevationZones.length > 0
      ? activeScene.elevationZones.map(z => `- ${z.name}: ${z.elevation > 0 ? '+' : ''}${z.elevation}m de altura`).join('\n')
      : 'Nenhuma elevação acentuada mapeada no momento.';

    // Lore memory injection
    const loreText = relevantLore.map(l => {
      return `[ENTIDADE: ${l.name.toUpperCase()} (${l.category})]
${l.description}
Tags: ${l.tags.join(', ')}
${l.knownByPlayers ? '(Fato conhecido pelos jogadores)' : '(SEGREDO: Jogadores ainda não sabem disto diretamente)'}`;
    }).join('\n\n');

    return `Você é o Mestre de RPG (Dungeon Master) de uma campanha viva e imersiva.
SEU PAPEL: Narrar o mundo, interpretar NPCs, reagir realisticamente às escolhas dos jogadores e aplicar as regras com consistência.

=== SISTEMA DE REGRAS ===
Sistema: ${rulesetName}
${campaign.ruleset === 'gurps'
  ? 'Mecânica: Testes rolam 3d6 contra o Nível de Habilidade (menor ou igual é sucesso). Margem de sucesso/fracasso importa. Altura dá bônus tático (+1 se estiver acima, -1 se estiver abaixo).'
  : 'Mecânica: Testes rolam 1d20 + modificador contra uma Classe de Dificuldade (CD). Terreno elevado concede vantagem ou +2.'}

=== CENA ATUAL ===
Nome da Cena: ${activeScene.name}
Descrição do Ambiente: ${activeScene.description}
Zonas de Terreno e Altura:
${zonesInfo}

=== PERSONAGENS PRESENTES NA CENA ===
${charsInfo}

=== BANCO DE MEMÓRIA DO MUNDO (LOREBOOK & FATOS REGISTRADOS) ===
IMPORTANTE: Você deve manter coerência absoluta com estes fatos. NUNCA contradiga o histórico do mundo.
${loreText || 'Nenhum registro antigo conflitante para este momento.'}

=== DIRETRIZES DE NARRATIVA ===
1. Responda em Português do Brasil com tom imersivo, atmosférico e dinâmico.
2. Descreva reações sensoriais dos NPCs e do ambiente.
3. Se um jogador tentar uma ação que exija teste (escalar, atacar, persuadir, notar algo escondido), determine o teste adequado e a dificuldade (CD no D&D ou teste de Perícia no GURPS).
4. Leve sempre em conta a ALTURA física dos personagens e do terreno na cena (quem está no alto tem visão ampla e vantagem em combate à distância).
5. Se uma nova informação factual crucial for revelada ou criada agora, mencione-a com clareza para registro no diário da campanha.`;
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
    
    // Always include entities mentioned directly or matching tags
    return loreList.filter(entity => {
      const nameMatch = qLower.includes(entity.name.toLowerCase());
      const tagMatch = entity.tags.some(tag => qLower.includes(tag.toLowerCase()));
      const descMatch = entity.description.toLowerCase().split(' ').some(word => word.length > 4 && qLower.includes(word));
      return nameMatch || tagMatch || descMatch;
    }).slice(0, 10); // keep top 10 relevant entities
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
