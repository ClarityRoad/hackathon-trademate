import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('🚀 Début de la requête API');
  
  try {
    const body = await request.json();
    const { input, threadId, marketData, marketInfo } = body;
    
    console.log('📝 Données reçues:', {
      input,
      threadId: threadId || 'nouveau thread',
      hasMarketData: !!marketData,
      hasMarketInfo: !!marketInfo
    });

    // Créer un nouveau thread si aucun n'existe
    const thread = threadId ? 
      { id: threadId } : 
      await openai.beta.threads.create();
    
    console.log('🧵 Thread ID:', thread.id);

    // Ajouter le message au thread
    console.log('📤 Envoi du message au thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input + "100 dernieres bougies: " + "[" + JSON.stringify(marketData) + "]" + "Informations du marché: " + "[" + JSON.stringify(marketInfo) + "]"
    });

    // Exécuter l'assistant sur le thread
    console.log('🤖 Démarrage de l\'assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID || '',
    });

    // Attendre la réponse
    console.log('⏳ Attente de la réponse...');
    let response;
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes maximum

    while (attempts < maxAttempts) {
      const runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      
      console.log('📊 Status:', runStatus.status);

      if (runStatus.status === 'completed') {
        // Récupérer les messages
        console.log('✅ Run complété, récupération des messages...');
        const messages = await openai.beta.threads.messages.list(thread.id);
        response = messages.data[0].content[0];
        break;
      } else if (runStatus.status === 'failed') {
        console.error('❌ Échec du run:', runStatus.last_error);
        throw new Error('Assistant run failed: ' + runStatus.last_error?.message);
      } else if (runStatus.status === 'expired') {
        console.error('⚠️ Run expiré');
        throw new Error('Assistant run expired');
      }

      // Attendre avant la prochaine vérification
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!response) {
      console.error('⚠️ Timeout - Pas de réponse après', maxAttempts, 'secondes');
      throw new Error('Assistant timeout');
    }

    console.log('🏁 Réponse obtenue avec succès');
    console.log('🔍 Contenu de la réponse:', response);

    // Extraire la valeur du texte de l'objet réponse
    const textValue = response.type === 'text' ? response.text.value : 'Erreur de format';

    return NextResponse.json({
      threadId: thread.id,
      response: textValue  // Envoyer uniquement la valeur du texte
    });

  } catch (error) {
    console.error('🔥 Erreur:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 