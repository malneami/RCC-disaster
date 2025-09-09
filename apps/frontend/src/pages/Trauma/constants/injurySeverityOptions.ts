/**
 * Detailed Injury Severity Options
 * Exact text descriptions for trauma injury assessment
 */

// Head and Neck Injury Options
export const HEAD_NECK_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - Tiny Epidural, Subdural, or Intracerebral Hematoma', label: '3 - Moderate: - Tiny Epidural, Subdural, or Intracerebral Hematoma' },
  { value: '3 - Moderate: - Intra-ventricular hemorrhage or subarachnoid hemorrhage', label: '3 - Moderate: - Intra-ventricular hemorrhage or subarachnoid hemorrhage' },
  { value: '3 - Moderate: - Simple undisplaced Skull Fracture', label: '3 - Moderate: - Simple undisplaced Skull Fracture' },
  { value: '3 - Moderate: - Penetrating Neck Injury with tissue loss', label: '3 - Moderate: - Penetrating Neck Injury with tissue loss' },
  { value: '4 - Serious: - Mild Brain Edema (Compressed ventricles without brain stem cisterns)', label: '4 - Serious: - Mild Brain Edema (Compressed ventricles without brain stem cisterns)' },
  { value: '4 - Serious: - Small Brain Contusion', label: '4 - Serious: - Small Brain Contusion' },
  { value: '4 - Serious: - Superficial penetrating injury to skull (less than 2 cm deep)', label: '4 - Serious: - Superficial penetrating injury to skull (less than 2 cm deep)' },
  { value: '4 - Serious: - Penetrating Neck Injury with major blood loss (More than 20%)', label: '4 - Serious: - Penetrating Neck Injury with major blood loss (More than 20%)' },
  { value: '5 - Severe: - Moderate Brain Edema (Compressed ventricles and brain stem cisterns)', label: '5 - Severe: - Moderate Brain Edema (Compressed ventricles and brain stem cisterns)' },
  { value: '5 - Severe: - Large Brain Contusion', label: '5 - Severe: - Large Brain Contusion' },
  { value: '6 - Critical: - Massive Brain Contusion', label: '6 - Critical: - Massive Brain Contusion' },
  { value: '6 - Critical: - Large Epidural, Subdural, or Intracerebral Hematoma', label: '6 - Critical: - Large Epidural, Subdural, or Intracerebral Hematoma' },
  { value: '6 - Critical: - Brain stem compression, herniation, infarction, or injury', label: '6 - Critical: - Brain stem compression, herniation, infarction, or injury' },
  { value: '6 - Critical: - Major penetrating injury to skull (more than 2 cm deep)', label: '6 - Critical: - Major penetrating injury to skull (more than 2 cm deep)' },
  { value: '6 - Critical: - Unilateral laceration of Head and Neck arteries', label: '6 - Critical: - Unilateral laceration of Head and Neck arteries' },
  { value: '6 - Critical: - Basilar artery injury', label: '6 - Critical: - Basilar artery injury' },
  { value: '6 - Critical: - Bilateral thrombosis of Head and Neck arteries', label: '6 - Critical: - Bilateral thrombosis of Head and Neck arteries' },
  { value: '6 - Critical: - C4 or below causing complete cord transection or contusion', label: '6 - Critical: - C4 or below causing complete cord transection or contusion' },
  { value: '7 - Unsurvivable: - Massive destruction of skull and brain', label: '7 - Unsurvivable: - Massive destruction of skull and brain' },
  { value: '7 - Unsurvivable: - Brain stem laceration, massive destruction', label: '7 - Unsurvivable: - Brain stem laceration, massive destruction' },
  { value: '7 - Unsurvivable: - Bilateral Laceration of Internal carotid arteries', label: '7 - Unsurvivable: - Bilateral Laceration of Internal carotid arteries' },
  { value: '7 - Unsurvivable: - C3 or higher causing complete cord transection', label: '7 - Unsurvivable: - C3 or higher causing complete cord transection' },
] as const;

// Face Injury Options
export const FACE_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - Simple facial fractures without displacement', label: '3 - Moderate: - Simple facial fractures without displacement' },
  { value: '3 - Moderate: - Minor eye/ear/nose injuries with normal function', label: '3 - Moderate: - Minor eye/ear/nose injuries with normal function' },
  { value: '4 - Serious: - Complex or displaced facial fractures', label: '4 - Serious: - Complex or displaced facial fractures' },
  { value: '4 - Serious: - Major eye injuries with partial vision loss', label: '4 - Serious: - Major eye injuries with partial vision loss' },
  { value: '4 - Serious: - Major ear injuries with partial hearing loss', label: '4 - Serious: - Major ear injuries with partial hearing loss' },
  { value: '5 - Severe: - Severe facial deformity requiring reconstruction', label: '5 - Severe: - Severe facial deformity requiring reconstruction' },
  { value: '5 - Severe: - Complete vision loss in one eye', label: '5 - Severe: - Complete vision loss in one eye' },
  { value: '5 - Severe: - Complete hearing loss in one ear', label: '5 - Severe: - Complete hearing loss in one ear' },
] as const;

// Chest Injury Options
export const CHEST_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - Simple rib fractures (1-2 ribs)', label: '3 - Moderate: - Simple rib fractures (1-2 ribs)' },
  { value: '3 - Moderate: - Minor pneumothorax without respiratory compromise', label: '3 - Moderate: - Minor pneumothorax without respiratory compromise' },
  { value: '3 - Moderate: - Minor lung contusion', label: '3 - Moderate: - Minor lung contusion' },
  { value: '4 - Serious: - Multiple rib fractures (3+ ribs)', label: '4 - Serious: - Multiple rib fractures (3+ ribs)' },
  { value: '4 - Serious: - Hemothorax requiring drainage', label: '4 - Serious: - Hemothorax requiring drainage' },
  { value: '4 - Serious: - Pneumothorax requiring chest tube', label: '4 - Serious: - Pneumothorax requiring chest tube' },
  { value: '4 - Serious: - Thoracic spine fracture without cord involvement', label: '4 - Serious: - Thoracic spine fracture without cord involvement' },
  { value: '5 - Severe: - Flail chest segment', label: '5 - Severe: - Flail chest segment' },
  { value: '5 - Severe: - Tension pneumothorax', label: '5 - Severe: - Tension pneumothorax' },
  { value: '5 - Severe: - Cardiac contusion with arrhythmia', label: '5 - Severe: - Cardiac contusion with arrhythmia' },
  { value: '5 - Severe: - Thoracic spine fracture with cord involvement', label: '5 - Severe: - Thoracic spine fracture with cord involvement' },
  { value: '6 - Critical: - Major thoracic vessel injury', label: '6 - Critical: - Major thoracic vessel injury' },
  { value: '6 - Critical: - Tracheal or bronchial tear', label: '6 - Critical: - Tracheal or bronchial tear' },
  { value: '6 - Critical: - Cardiac rupture with tamponade', label: '6 - Critical: - Cardiac rupture with tamponade' },
  { value: '6 - Critical: - Diaphragmatic rupture with herniation', label: '6 - Critical: - Diaphragmatic rupture with herniation' },
  { value: '7 - Unsurvivable: - Complete transection of thoracic aorta', label: '7 - Unsurvivable: - Complete transection of thoracic aorta' },
  { value: '7 - Unsurvivable: - Massive bilateral pulmonary destruction', label: '7 - Unsurvivable: - Massive bilateral pulmonary destruction' },
] as const;

// Abdomen Injury Options
export const ABDOMEN_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - Liver laceration <3cm', label: '3 - Moderate: - Liver laceration <3cm' },
  { value: '3 - Moderate: - Spleen laceration <3cm', label: '3 - Moderate: - Spleen laceration <3cm' },
  { value: '3 - Moderate: - Small bowel/colon injury <50%', label: '3 - Moderate: - Small bowel/colon injury <50%' },
  { value: '3 - Moderate: - Kidney laceration <1cm', label: '3 - Moderate: - Kidney laceration <1cm' },
  { value: '3 - Moderate: - Bladder contusion', label: '3 - Moderate: - Bladder contusion' },
  { value: '4 - Serious: - Liver/Spleen laceration >3cm with duct involvement', label: '4 - Serious: - Liver/Spleen laceration >3cm with duct involvement' },
  { value: '4 - Serious: - Bowel injury >50%', label: '4 - Serious: - Bowel injury >50%' },
  { value: '4 - Serious: - Kidney laceration >1cm', label: '4 - Serious: - Kidney laceration >1cm' },
  { value: '4 - Serious: - Vessel rupture', label: '4 - Serious: - Vessel rupture' },
  { value: '4 - Serious: - Bladder laceration', label: '4 - Serious: - Bladder laceration' },
  { value: '5 - Severe: - Liver disruption <75% of lobe', label: '5 - Severe: - Liver disruption <75% of lobe' },
  { value: '5 - Severe: - Spleen devascularization >25%', label: '5 - Severe: - Spleen devascularization >25%' },
  { value: '5 - Severe: - Massive bowel tissue loss', label: '5 - Severe: - Massive bowel tissue loss' },
  { value: '5 - Severe: - Kidney collecting system injury', label: '5 - Severe: - Kidney collecting system injury' },
  { value: '6 - Critical: - Liver disruption >75% of lobe', label: '6 - Critical: - Liver disruption >75% of lobe' },
  { value: '6 - Critical: - Spleen hilum injury', label: '6 - Critical: - Spleen hilum injury' },
  { value: '6 - Critical: - Kidney hilum avulsion', label: '6 - Critical: - Kidney hilum avulsion' },
  { value: '6 - Critical: - Abdominal aortic rupture', label: '6 - Critical: - Abdominal aortic rupture' },
  { value: '7 - Unsurvivable: - Liver avulsion (complete vascular separation)', label: '7 - Unsurvivable: - Liver avulsion (complete vascular separation)' },
] as const;

// Extremities Injury Options
export const EXTREMITIES_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - Fractures (upper/lower extremity) not open', label: '3 - Moderate: - Fractures (upper/lower extremity) not open' },
  { value: '3 - Moderate: - Vascular injury without major blood loss', label: '3 - Moderate: - Vascular injury without major blood loss' },
  { value: '3 - Moderate: - Compartment syndrome without muscle loss', label: '3 - Moderate: - Compartment syndrome without muscle loss' },
  { value: '3 - Moderate: - Amputation at wrist or ankle', label: '3 - Moderate: - Amputation at wrist or ankle' },
  { value: '4 - Serious: - Pelvic Ring Fracture (Open Book)', label: '4 - Serious: - Pelvic Ring Fracture (Open Book)' },
  { value: '4 - Serious: - Open Fractures (upper/lower extremity)', label: '4 - Serious: - Open Fractures (upper/lower extremity)' },
  { value: '4 - Serious: - Vascular injury with major blood loss', label: '4 - Serious: - Vascular injury with major blood loss' },
  { value: '4 - Serious: - Compartment syndrome with muscle loss', label: '4 - Serious: - Compartment syndrome with muscle loss' },
  { value: '4 - Serious: - Amputation below elbow/above wrist', label: '4 - Serious: - Amputation below elbow/above wrist' },
  { value: '4 - Serious: - Amputation below knee/above ankle', label: '4 - Serious: - Amputation below knee/above ankle' },
  { value: '5 - Severe: - Pelvic Ring Fracture with major bleeding', label: '5 - Severe: - Pelvic Ring Fracture with major bleeding' },
  { value: '5 - Severe: - Amputation above elbow or knee', label: '5 - Severe: - Amputation above elbow or knee' },
] as const;

// External Injury Options
export const EXTERNAL_INJURY_OPTIONS = [
  { value: '1 - No Injury: - No injury', label: '1 - No Injury: - No injury' },
  { value: '2 - Minor: - All Other Injuries', label: '2 - Minor: - All Other Injuries' },
  { value: '3 - Moderate: - 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface', label: '3 - Moderate: - 2nd or 3rd degree burns involving 10% to 19% of Total Body Surface' },
  { value: '4 - Serious: - Total scalp avulsion or scalp injury with significant blood loss', label: '4 - Serious: - Total scalp avulsion or scalp injury with significant blood loss' },
  { value: '4 - Serious: - 2nd or 3rd degree burns involving 20% to 29% of Total Body Surface', label: '4 - Serious: - 2nd or 3rd degree burns involving 20% to 29% of Total Body Surface' },
  { value: '4 - Serious: - Near drowning without neurological deficit', label: '4 - Serious: - Near drowning without neurological deficit' },
  { value: '5 - Severe: - 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface', label: '5 - Severe: - 2nd or 3rd degree burns involving 30% to 39% of Total Body Surface' },
  { value: '5 - Severe: - Near drowning with neurological deficit', label: '5 - Severe: - Near drowning with neurological deficit' },
  { value: '6 - Critical: - 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface', label: '6 - Critical: - 2nd or 3rd degree burns involving 40% to 90% of Total Body Surface' },
  { value: '6 - Critical: - Drowning with cardiac arrest', label: '6 - Critical: - Drowning with cardiac arrest' },
  { value: '7 - Unsurvivable: - 2nd or 3rd degree burns involving most of Total Body Surface', label: '7 - Unsurvivable: - 2nd or 3rd degree burns involving most of Total Body Surface' },
  { value: '7 - Unsurvivable: - Explosion injury affecting the whole body', label: '7 - Unsurvivable: - Explosion injury affecting the whole body' },
] as const;

