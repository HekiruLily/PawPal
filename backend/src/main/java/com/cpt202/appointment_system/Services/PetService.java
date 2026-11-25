package com.cpt202.appointment_system.Services;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cpt202.appointment_system.Models.*;
import com.cpt202.appointment_system.Repositories.PetRepo;
import com.cpt202.appointment_system.Common.ApiException;

@Service
public class PetService {
    private final PetRepo petRepo;
    private final CatalogService catalog;
    private final SessionService sessions;
    private final UploadService uploads;
    public PetService(PetRepo petRepo, CatalogService catalog, SessionService sessions, UploadService uploads) {
        this.petRepo = petRepo; this.catalog = catalog; this.sessions = sessions; this.uploads = uploads;
    }
    public List<Pet> listAllPets(User user) { return petRepo.findByUser(user).stream().filter(p -> !Boolean.TRUE.equals(p.getDeleted()) && !"".equals(p.getType())).collect(Collectors.toList()); }
    public int addPet(MultipartFile file, Pet pet) {
        if (file != null && !file.isEmpty()) pet.setImageURL(uploads.save(file));
        if (pet.getAge() == null) pet.setAge(0);
        catalog.savePet(sessions.current(), null, pet); return 0;
    }
    public int editPet(MultipartFile file, Pet pet) {
        Pet old = petRepo.findByPid(pet.getPid());
        if (old == null || !old.getUser().getUid().equals(sessions.current().getUid())) throw new ApiException(404, "Không tìm thấy thú cưng.");
        if (pet.getName() == null || pet.getName().isBlank()) pet.setName(old.getName());
        if (pet.getType() == null || pet.getType().isBlank()) pet.setType(old.getType());
        if (pet.getSize() == null || pet.getSize().isBlank()) pet.setSize(old.getSize());
        if (pet.getAge() == null) pet.setAge(old.getAge() == null ? 0 : old.getAge());
        if (pet.getImageURL() == null) pet.setImageURL(old.getImageURL());
        if (file != null && !file.isEmpty()) pet.setImageURL(uploads.save(file));
        catalog.savePet(sessions.current(), pet.getPid(), pet); return 0;
    }
    public void pseudoDeletePet(Pet pet, User user) { catalog.deletePet(sessions.current(), pet.getPid()); }
}
