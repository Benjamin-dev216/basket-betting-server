import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserEntity, BetEntity } from "./index";

@Entity("bet_slip")
export class BetSlipEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserEntity, user => user.bets)
  user: UserEntity;

  @Column()
  type: 'single' | 'parlay';

  @Column('float')
  stake: number;

  @Column('float')
  potentialWin: number;

  @Column()
  status: 'pending' | 'won' | 'lost';

  @OneToMany(() => BetEntity, bet => bet.slip, { cascade: true })
  bets: BetEntity[];
}
