import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';
import { StrokeKPICalculatorService } from '../stroke-cases/services/stroke-kpi-calculator.service';
import { StemiKpiService } from '../stemi-cases/services/stemi-kpi.service';
import { TraumaKpiService } from '../trauma-cases/services/trauma-kpi.service';
import { StrokeCasesService } from '../stroke-cases/stroke-cases.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ticket: {
      count: jest.fn().mockResolvedValue(0),
    },
    criticalCase: {
      count: jest.fn().mockResolvedValue(0),
    },
    eMSAssignment: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    strokeCase: {
      count: jest.fn().mockResolvedValue(0),
    },
    stemiCase: {
      count: jest.fn().mockResolvedValue(0),
    },
    traumaCase: {
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const mockStrokeKPICalculatorService = {};
  const mockStemiKpiService = {
    getKpiSummary: jest.fn().mockResolvedValue({}),
  };
  const mockTraumaKpiService = {
    getKPISummary: jest.fn().mockResolvedValue({ totalCases: 0 }),
  };
  const mockStrokeCasesService = {
    getKPISummary: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StrokeKPICalculatorService, useValue: mockStrokeKPICalculatorService },
        { provide: StemiKpiService, useValue: mockStemiKpiService },
        { provide: TraumaKpiService, useValue: mockTraumaKpiService },
        { provide: StrokeCasesService, useValue: mockStrokeCasesService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    it('should use "All Time" date range (from 2024-01-01) when date filters are not provided', async () => {
      // Act
      await service.getDashboardMetrics({});

      // Assert - Check that all metrics use the "All Time" date range
      
      // Active Transfers should use date filters
      expect(prismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                createdAt: expect.objectContaining({
                  gte: new Date('2024-01-01T00:00:00.000Z'),
                })
              })
            ])
          })
        })
      );

      // Urgent Pathway Cases should use date filters for both tickets and critical cases
      expect(prismaService.ticket.count).toHaveBeenCalled();
      expect(prismaService.criticalCase.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                createdAt: expect.objectContaining({
                  gte: new Date('2024-01-01T00:00:00.000Z'),
                })
              })
            ])
          })
        })
      );

      // Completed Cases should use date filters
      expect(prismaService.eMSAssignment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            journeyEndTime: expect.objectContaining({
              gte: new Date('2024-01-01T00:00:00.000Z'),
            })
          })
        })
      );

      // Delayed Transfers should use date filters
      expect(prismaService.eMSAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            journeyEndTime: expect.objectContaining({
              gte: new Date('2024-01-01T00:00:00.000Z'),
            })
          })
        })
      );
    });

    it('should use provided date range when filters are present', async () => {
      // Arrange
      const filters = {
        startDate: '2025-05-01',
        endDate: '2025-05-02',
      };
      
      // Act
      await service.getDashboardMetrics(filters);

      // Assert - Check that all metrics use the provided date range
      
      // Active Transfers
      expect(prismaService.ticket.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                createdAt: expect.objectContaining({
                  gte: new Date('2025-05-01T00:00:00.000Z'),
                  lt: new Date('2025-05-02T23:59:59.999Z'),
                })
              })
            ])
          })
        })
      );

      // Completed Cases
      expect(prismaService.eMSAssignment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            journeyEndTime: expect.objectContaining({
              gte: new Date('2025-05-01T00:00:00.000Z'),
              lt: new Date('2025-05-02T23:59:59.999Z'),
            })
          })
        })
      );
    });
  });
  
  describe('getPathwayPerformanceMetrics', () => {
      it('should use "All Time" date range (from 2024-01-01) when date filters are not provided', async () => {
          await service.getPathwayPerformanceMetrics({});
          
          expect(mockStrokeCasesService.getKPISummary).toHaveBeenCalledWith(
              expect.objectContaining({
                  startDate: '2024-01-01'
              })
          );
      });
  });
});
