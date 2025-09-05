import React from 'react';

interface LotteryTicketProps {
  ticket: {
    ticketId?: string;
    numbers: number[];
    powerball: number;
    type: 'manual' | 'quickpick';
    createdAt?: string | Date;
    drawDate?: string | Date;
    ticketNumber?: number;
  };
  index?: number;
  showTicketNumber?: boolean;
  className?: string;
}

export default function LotteryTicket({ 
  ticket, 
  index = 0, 
  showTicketNumber = true,
  className = ""
}: LotteryTicketProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`lottery-ticket ${className}`}>
      {/* Ticket Header */}
      <div className="ticket-header">
        <div className="ticket-logo">
          <div className="logo-circle">
            <span className="logo-text">C</span>
          </div>
          <div className="logo-text-main">CRYPTOLOTTERY</div>
        </div>
        <div className="ticket-type-badge">
          {ticket.type === 'quickpick' ? 'QUICK PICK' : 'MANUAL'}
        </div>
      </div>

      {/* Ticket ID */}
      <div className="ticket-id-section">
        <div className="ticket-id-label">TICKET ID</div>
        <div className="ticket-id-value">{ticket.ticketId || `TKT${String(index + 1).padStart(6, '0')}`}</div>
      </div>

      {/* Numbers Section */}
      <div className="numbers-section">
        <div className="main-numbers">
          <div className="numbers-label">MAIN NUMBERS</div>
          <div className="numbers-grid">
            {ticket.numbers.map((num, idx) => (
              <div key={idx} className="number-ball main-ball">
                {num.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        
        <div className="powerball-section">
          <div className="powerball-label">POWERBALL</div>
          <div className="powerball-ball">
            {ticket.powerball.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Draw Information */}
      <div className="draw-info">
        <div className="draw-date">
          <span className="draw-label">DRAW DATE:</span>
          <span className="draw-value">
            {ticket.drawDate ? formatDate(ticket.drawDate) : 'TBD'}
          </span>
        </div>
        {ticket.createdAt && (
          <div className="purchase-time">
            <span className="time-label">PURCHASED:</span>
            <span className="time-value">
              {formatDate(ticket.createdAt)} {formatTime(ticket.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Ticket Footer */}
      <div className="ticket-footer">
        <div className="ticket-number">
          {showTicketNumber && `TICKET ${index + 1}`}
        </div>
        <div className="ticket-value">$5.00</div>
      </div>

      {/* Decorative Elements */}
      <div className="ticket-decoration">
        <div className="decoration-line top"></div>
        <div className="decoration-line bottom"></div>
        <div className="corner-cuts">
          <div className="corner-cut top-left"></div>
          <div className="corner-cut top-right"></div>
          <div className="corner-cut bottom-left"></div>
          <div className="corner-cut bottom-right"></div>
        </div>
      </div>
    </div>
  );
}
