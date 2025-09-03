import { ticketGenerator } from '@/lib/ticketGenerator';
import { activePurchases, numberSelections } from '../stores/activeData';
import { syncTicketsToBackend } from '../utils/ticketSync';

export async function handlePaymentButton(interaction: any) {
  // This would typically be handled by webhook, but for demo purposes
  await interaction.reply({
    content: 'Payment button clicked! Please complete the payment in the opened window.',
    ephemeral: true
  });
}

export async function handleNumberSelection(interaction: any) {
  const userId = interaction.user.id;
  const number = parseInt(interaction.customId.split('_')[2]);
  
  let selection = numberSelections.get(userId) || {
    mainNumbers: [],
    powerball: 0,
    isComplete: false
  };

  // Check if number is already selected
  if (selection.mainNumbers.includes(number)) {
    await interaction.reply({
      content: `❌ Number ${number} is already selected!`,
      ephemeral: true
    });
    return;
  }

  // Add number if we haven't reached 5 yet
  if (selection.mainNumbers.length < 5) {
    selection.mainNumbers.push(number);
    selection.mainNumbers.sort((a, b) => a - b);
    
    // Check if selection is complete
    selection.isComplete = selection.mainNumbers.length === 5 && selection.powerball > 0;
    
    numberSelections.set(userId, selection);

    const statusText = selection.isComplete 
      ? '✅ **Selection Complete!**' 
      : `🔢 **Selected:** ${selection.mainNumbers.join(', ')} (${selection.mainNumbers.length}/5)`;

    await interaction.reply({
      content: `${statusText}\n\n**Main Numbers:** ${selection.mainNumbers.join(', ')}\n**Powerball:** ${selection.powerball || 'Not selected'}\n\n${selection.isComplete ? 'Click "Submit Ticket" to confirm!' : 'Select more numbers or choose your Powerball.'}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ You already have 5 numbers selected: ${selection.mainNumbers.join(', ')}\n\nRemove a number first or submit your ticket!`,
      ephemeral: true
    });
  }
}

export async function handleQuickPickButton(interaction: any) {
  const userId = interaction.user.id;
  
  // Check if user has an active purchase
  const activePurchase = activePurchases.get(userId);
  if (!activePurchase) {
    await interaction.reply({
      content: '❌ No active ticket purchase found. Use `/buy-tickets` first.',
      ephemeral: true
    });
    return;
  }

  const { numbers, powerball } = ticketGenerator.generateRandomNumbers();
  
  // Store the quickpick selection
  numberSelections.set(userId, {
    mainNumbers: numbers,
    powerball,
    isComplete: true
  });

  await interaction.reply({
    content: `**QuickPick Generated!**\n\n🔢 **Numbers:** ${numbers.join(', ')}\n **Powerball:** ${powerball}\n\nClick "Submit Ticket" to confirm or use the number picker to customize.`,
    ephemeral: true
  });
}

export async function handleSubmitTicket(interaction: any) {
  const userId = interaction.user.id;
  const selection = numberSelections.get(userId);
  const activePurchase = activePurchases.get(userId);

  if (!selection || !selection.isComplete || !activePurchase) {
    await interaction.reply({
      content: '❌ Please complete your number selection first.\n\n**Required:** 5 main numbers (1-69) + 1 Powerball (1-25)',
      ephemeral: true
    });
    return;
  }

  // Add ticket to active purchase
  activePurchase.tickets.push({
    numbers: selection.mainNumbers,
    powerball: selection.powerball,
    type: 'manual'
  });

  activePurchase.currentTicket++;

  if (activePurchase.currentTicket < activePurchase.ticketCount) {
    // Reset selection for next ticket
    numberSelections.delete(userId);
    
    await interaction.reply({
      content: `✅ **Ticket ${activePurchase.currentTicket} submitted!**\n\n🎫 **Progress:** ${activePurchase.currentTicket}/${activePurchase.ticketCount}\n\n**Numbers:** ${selection.mainNumbers.join(', ')} | **Powerball:** ${selection.powerball}\n\nPlease select numbers for your next ticket.`,
      ephemeral: true
    });
  } else {
    // All tickets completed, sync to backend
    try {
      await syncTicketsToBackend(activePurchase, userId);
      
      // Clear active purchase
      activePurchases.delete(userId);
      numberSelections.delete(userId);
      
      await interaction.reply({
        content: `🎉 **All ${activePurchase.ticketCount} tickets submitted and synced!**\n\n✅ Your tickets have been saved to your account.\n🔗 View them on the website by connecting your wallet.\n\n🖼️ **Ticket images will be generated shortly for social sharing!**`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error syncing tickets:', error);
      await interaction.reply({
        content: '❌ **Error syncing tickets!** Please try again or contact support.',
        ephemeral: true
      });
    }
  }
}

export async function handleNumberDropdown(interaction: any) {
  // Handle number selection from dropdown
  await interaction.reply({
    content: '🔢 Number selected from dropdown!',
    ephemeral: true
  });
}

export async function handlePowerballSelection(interaction: any) {
  const userId = interaction.user.id;
  const powerball = parseInt(interaction.values[0]);
  
  let selection = numberSelections.get(userId) || {
    mainNumbers: [],
    powerball: 0,
    isComplete: false
  };

  selection.powerball = powerball;
  selection.isComplete = selection.mainNumbers.length === 5 && powerball > 0;
  
  numberSelections.set(userId, selection);

  const statusText = selection.isComplete 
    ? '✅ **Selection Complete!**' 
    : `🎯 **Powerball selected:** ${powerball}`;

  await interaction.reply({
    content: `${statusText}\n\n**Main Numbers:** ${selection.mainNumbers.join(', ') || 'Not selected'}\n**Powerball:** ${powerball}\n\n${selection.isComplete ? 'Click "Submit Ticket" to confirm!' : 'Please select 5 main numbers first.'}`,
    ephemeral: true
  });
}
